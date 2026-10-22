use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

use hidapi::{HidApi, HidDevice};

use super::protocol::{Command, Response, Value, REPORT_ID_COMMAND, REPORT_ID_RESPONSE, REPORT_SIZE};

pub const USB_VID: u16 = 0x1209;
pub const USB_PID: u16 = 0x4FFB;
const VENDOR_USAGE_PAGE: u16 = 0xFF00;

#[derive(Default)]
pub struct Device {
    api: Option<HidApi>,
    dev: Option<HidDevice>,
    sequence: u8,
    client_tag: u16,
}

impl Device {
    pub fn is_connected(&self) -> bool {
        self.dev.is_some()
    }

    pub fn connect(&mut self) -> Result<(), String> {
        if self.dev.is_some() {
            return Ok(());
        }

        if self.api.is_none() {
            self.api = Some(HidApi::new().map_err(|e| e.to_string())?);
        }
        let api = self.api.as_mut().unwrap();
        api.refresh_devices().map_err(|e| e.to_string())?;

        let info = api
            .device_list()
            .find(|d| {
                d.vendor_id() == USB_VID
                    && d.product_id() == USB_PID
                    && d.usage_page() == VENDOR_USAGE_PAGE
            })
            .ok_or_else(|| "device not found".to_string())?;

        let dev = info.open_device(api).map_err(|e| e.to_string())?;
        self.dev = Some(dev);
        Ok(())
    }

    pub fn disconnect(&mut self) {
        self.dev = None;
    }

    pub fn transact(&mut self, command: Command, param_id: u16, value: Value) -> Result<Response, String> {
        let attempts = if command.is_resendable() { MAX_SENDS } else { 1 };
        let mut last = String::new();
        for _ in 0..attempts {
            match self.transact_once(command, param_id, value) {
                Ok(response) => return Ok(response),
                Err(Error::NoReply(message)) => last = message,
                Err(Error::Usb(message)) => {
                    self.dev = None;
                    return Err(message);
                }
            }
        }
        Err(last)
    }

    fn transact_once(&mut self, command: Command, param_id: u16, value: Value) -> Result<Response, Error> {
        let usb = |e: hidapi::HidError| Error::Usb(e.to_string());
        let tag = self.client_tag();
        let dev = self.dev.as_ref().ok_or_else(|| Error::Usb("not connected".into()))?;

        let mut buf = [0u8; 64];
        for _ in 0..MAX_STALE_REPORTS {
            if dev.read_timeout(&mut buf, 0).map_err(usb)? == 0 {
                break;
            }
        }

        self.sequence = self.sequence.wrapping_add(1);
        let sequence = self.sequence;
        let (value_type, value_bytes) = value.encode();

        let mut out = [0u8; REPORT_SIZE + 1];
        out[0] = REPORT_ID_COMMAND;
        out[1] = command as u8;
        out[2..4].copy_from_slice(&param_id.to_le_bytes());
        out[4] = value_type;
        out[5..9].copy_from_slice(&value_bytes);
        out[9] = sequence;
        out[10..12].copy_from_slice(&tag.to_le_bytes());
        dev.write(&out).map_err(usb)?;

        let deadline = Instant::now() + REPLY_TIMEOUT;
        loop {
            let left = deadline.saturating_duration_since(Instant::now());
            if left.is_zero() {
                return Err(Error::NoReply(format!("no reply from the base (sequence {sequence})")));
            }
            let n = dev.read_timeout(&mut buf, left.as_millis().max(1) as i32).map_err(usb)?;
            let raw = &buf[1..];
            if n > REPORT_SIZE && buf[0] == REPORT_ID_RESPONSE && reply_tag(raw) == tag && raw[9] == sequence {
                return Ok(decode(raw));
            }
        }
    }

    fn client_tag(&mut self) -> u16 {
        if self.client_tag == 0 {
            let nanos = SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.subsec_nanos()).unwrap_or(0);
            self.client_tag = ((nanos ^ std::process::id().rotate_left(16)) as u16).max(1);
        }
        self.client_tag
    }
}

fn reply_tag(raw: &[u8]) -> u16 {
    u16::from_le_bytes([raw[10], raw[11]])
}

fn decode(raw: &[u8]) -> Response {
    Response {
        status: raw[0],
        value: Value::decode(raw[4], [raw[5], raw[6], raw[7], raw[8]]),
    }
}

const REPLY_TIMEOUT: Duration = Duration::from_millis(100);
const MAX_STALE_REPORTS: usize = 128;
const MAX_SENDS: usize = 3;

enum Error {
    Usb(String),
    NoReply(String),
}
