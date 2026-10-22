use std::thread;
use std::time::Duration;

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
                Err(Error::Mismatch(message)) => last = message,
                Err(Error::Usb(message)) => {
                    self.dev = None;
                    return Err(message);
                }
            }
        }
        Err(last)
    }

    fn transact_once(&mut self, command: Command, param_id: u16, value: Value) -> Result<Response, Error> {
        let dev = self.dev.as_ref().ok_or_else(|| Error::Usb("not connected".into()))?;
        let usb = |e: hidapi::HidError| Error::Usb(e.to_string());

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
        dev.write(&out).map_err(usb)?;

        let mut inp = [0u8; REPORT_SIZE + 1];
        for read in 0..MAX_READS {
            inp[0] = REPORT_ID_RESPONSE;
            dev.get_input_report(&mut inp).map_err(usb)?;
            if inp[1 + 9] == sequence {
                let raw = &inp[1..];
                return Ok(Response {
                    status: raw[0],
                    value: Value::decode(raw[4], [raw[5], raw[6], raw[7], raw[8]]),
                });
            }
            thread::sleep(Duration::from_millis(2 * (read as u64 + 1)));
        }
        Err(Error::Mismatch(format!(
            "sequence mismatch: sent {sequence}, got {}",
            inp[1 + 9]
        )))
    }
}

const MAX_READS: usize = 5;
const MAX_SENDS: usize = 3;

enum Error {
    Usb(String),
    Mismatch(String),
}
