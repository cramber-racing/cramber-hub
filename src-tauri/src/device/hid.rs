use hidapi::{HidApi, HidDevice};

use super::protocol::{Command, Response, Value, REPORT_ID_COMMAND, REPORT_ID_RESPONSE, REPORT_SIZE};

const USB_VID: u16 = 0x1209;
const USB_PID: u16 = 0x4FFB;
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
        let result = self.transact_inner(command, param_id, value);
        if result.is_err() {
            self.dev = None;
        }
        result
    }

    fn transact_inner(&mut self, command: Command, param_id: u16, value: Value) -> Result<Response, String> {
        let dev = self.dev.as_ref().ok_or_else(|| "not connected".to_string())?;

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
        dev.write(&out).map_err(|e| e.to_string())?;

        let mut inp = [0u8; REPORT_SIZE + 1];
        inp[0] = REPORT_ID_RESPONSE;
        dev.get_input_report(&mut inp).map_err(|e| e.to_string())?;

        let raw = &inp[1..];
        let status = raw[0];
        let resp_value_type = raw[4];
        let resp_value = [raw[5], raw[6], raw[7], raw[8]];
        let resp_sequence = raw[9];

        if resp_sequence != sequence {
            return Err(format!("sequence mismatch: sent {sequence}, got {resp_sequence}"));
        }

        Ok(Response {
            status,
            value: Value::decode(resp_value_type, resp_value),
        })
    }
}
