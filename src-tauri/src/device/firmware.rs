use std::thread;
use std::time::{Duration, Instant};

use hidapi::{HidApi, HidDevice};
use serde::Serialize;

use super::hid::USB_VID;

const BOOT_PID: u16 = 0x4FFC;

const REPORT_SIZE: usize = 64;
const DATA_OFFSET: usize = 8;
const DATA_MAX: usize = REPORT_SIZE - DATA_OFFSET;

const APP_HEADER_SIZE: usize = 0x200;
const APP_HEADER_MAGIC: u32 = 0x4352_4D41;
const RAM_START: u32 = 0x2000_0000;
const RAM_END: u32 = 0x2002_0000;
const APP_VECTOR_ADDR: u32 = 0x0800_8200;
const APP_REGION_END: u32 = 0x080C_0000;

const CMD_INFO: u8 = 0x01;
const CMD_ERASE: u8 = 0x02;
const CMD_WRITE: u8 = 0x03;
const CMD_FINISH: u8 = 0x04;
const CMD_BOOT: u8 = 0x05;

const REPLY_TIMEOUT: Duration = Duration::from_secs(2);
const ERASE_TIMEOUT: Duration = Duration::from_secs(30);
const APPEAR_TIMEOUT: Duration = Duration::from_secs(15);

pub struct FirmwareImage {
    pub version: u32,
    body: Vec<u8>,
}

#[derive(Serialize)]
pub struct FirmwareInfo {
    pub version: u32,
    pub size: usize,
}

impl FirmwareImage {
    pub fn read(path: &str) -> Result<Self, String> {
        let bytes = std::fs::read(path).map_err(|e| format!("Couldn't read the file: {e}"))?;
        let word = |at: usize| u32::from_le_bytes([bytes[at], bytes[at + 1], bytes[at + 2], bytes[at + 3]]);

        if bytes.len() < APP_HEADER_SIZE + 8 || word(0) != APP_HEADER_MAGIC {
            return Err("That file isn't Cramber DD firmware.".into());
        }
        let stack = word(APP_HEADER_SIZE);
        let reset = word(APP_HEADER_SIZE + 4);
        if !(RAM_START..=RAM_END).contains(&stack) || !(APP_VECTOR_ADDR..APP_REGION_END).contains(&reset) {
            return Err("That firmware file is damaged.".into());
        }

        let mut body = bytes[APP_HEADER_SIZE..].to_vec();
        if body.len() > (APP_REGION_END - APP_VECTOR_ADDR) as usize {
            return Err("That firmware is too large for the base.".into());
        }
        while body.len() % 4 != 0 {
            body.push(0xFF);
        }
        Ok(Self { version: word(12), body })
    }

    pub fn info(&self) -> FirmwareInfo {
        FirmwareInfo { version: self.version, size: self.body.len() }
    }
}

#[derive(Clone, Copy, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Stage {
    Restarting,
    Erasing,
    Writing,
    Verifying,
    Starting,
}

pub fn bootloader_present() -> bool {
    HidApi::new()
        .map(|api| api.device_list().any(|d| d.vendor_id() == USB_VID && d.product_id() == BOOT_PID))
        .unwrap_or(false)
}

pub fn wait_for_bootloader() -> Result<Bootloader, String> {
    let deadline = Instant::now() + APPEAR_TIMEOUT;
    loop {
        if let Some(bootloader) = Bootloader::open() {
            return Ok(bootloader);
        }
        if Instant::now() >= deadline {
            return Err("The base didn't restart into update mode.".into());
        }
        thread::sleep(Duration::from_millis(250));
    }
}

pub struct Bootloader {
    dev: HidDevice,
    sequence: u8,
}

struct Reply {
    status: u8,
    value: u32,
}

impl Bootloader {
    fn open() -> Option<Self> {
        let api = HidApi::new().ok()?;
        let info = api
            .device_list()
            .find(|d| d.vendor_id() == USB_VID && d.product_id() == BOOT_PID)?;
        let dev = info.open_device(&api).ok()?;
        Some(Self { dev, sequence: 0 })
    }

    fn request(&mut self, command: u8, argument: u32, data: &[u8], timeout: Duration) -> Result<Reply, String> {
        self.sequence = self.sequence.wrapping_add(1);
        let mut out = [0u8; REPORT_SIZE + 1]; // [0] = report ID (none)
        out[1] = command;
        out[2] = self.sequence;
        out[3..5].copy_from_slice(&(data.len() as u16).to_le_bytes());
        out[5..9].copy_from_slice(&argument.to_le_bytes());
        out[1 + DATA_OFFSET..1 + DATA_OFFSET + data.len()].copy_from_slice(data);
        self.dev.write(&out).map_err(|e| format!("Lost the connection to the base ({e})."))?;

        let deadline = Instant::now() + timeout;
        let mut buf = [0u8; REPORT_SIZE];
        loop {
            let left = deadline.saturating_duration_since(Instant::now());
            if left.is_zero() {
                return Err("The base stopped responding during the update.".into());
            }
            let n = self
                .dev
                .read_timeout(&mut buf, left.as_millis().max(1) as i32)
                .map_err(|e| format!("Lost the connection to the base ({e})."))?;
            if n >= 8 && buf[0] == command && buf[1] == self.sequence {
                return Ok(Reply { status: buf[2], value: u32::from_le_bytes([buf[4], buf[5], buf[6], buf[7]]) });
            }
        }
    }

    fn expect_ok(&mut self, step: &str, command: u8, argument: u32, data: &[u8], timeout: Duration) -> Result<u32, String> {
        let reply = self.request(command, argument, data, timeout)?;
        match reply.status {
            0 => Ok(reply.value),
            4 => Err("The firmware didn't check out after writing it. Try again.".into()),
            status => Err(format!("The base couldn't {step} the firmware (error {status}).")),
        }
    }

    pub fn install(&mut self, image: &FirmwareImage, mut progress: impl FnMut(Stage, f64)) -> Result<(), String> {
        let size = image.body.len() as u32;
        self.expect_ok("prepare for", CMD_INFO, 0, &[], REPLY_TIMEOUT)?;

        progress(Stage::Erasing, 0.0);
        self.expect_ok("erase the old", CMD_ERASE, size, &[], ERASE_TIMEOUT)?;

        progress(Stage::Writing, 0.0);
        let chunks = image.body.chunks(DATA_MAX).count().max(1);
        for (i, chunk) in image.body.chunks(DATA_MAX).enumerate() {
            self.expect_ok("write", CMD_WRITE, (i * DATA_MAX) as u32, chunk, REPLY_TIMEOUT)?;
            if i % 32 == 0 || i + 1 == chunks {
                progress(Stage::Writing, (i + 1) as f64 / chunks as f64);
            }
        }

        progress(Stage::Verifying, 1.0);
        let mut finish = [0u8; 8];
        finish[0..4].copy_from_slice(&crc32(&image.body).to_le_bytes());
        finish[4..8].copy_from_slice(&image.version.to_le_bytes());
        self.expect_ok("verify", CMD_FINISH, size, &finish, REPLY_TIMEOUT)?;

        progress(Stage::Starting, 1.0);
        self.expect_ok("start", CMD_BOOT, 0, &[], REPLY_TIMEOUT)?;
        Ok(())
    }
}

fn crc32(data: &[u8]) -> u32 {
    let mut crc = 0xFFFF_FFFFu32;
    for &byte in data {
        crc ^= byte as u32;
        for _ in 0..8 {
            crc = (crc >> 1) ^ (0xEDB8_8320 & (crc & 1).wrapping_neg());
        }
    }
    !crc
}
