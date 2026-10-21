use serde::{Deserialize, Serialize};

pub const REPORT_ID_COMMAND: u8 = 21;
pub const REPORT_ID_RESPONSE: u8 = 23;
pub const REPORT_SIZE: usize = 16;

#[derive(Clone, Copy)]
#[repr(u8)]
pub enum Command {
    Get = 0x01,
    Set = 0x02,
    Calibrate = 0x04,
    Reboot = 0x07,
    ClearFault = 0x08,
    GetDefault = 0x0A,
}

#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
#[serde(tag = "type", content = "value", rename_all = "lowercase")]
pub enum Value {
    None,
    U32(u32),
    I32(i32),
    F32(f32),
    Bool(bool),
}

impl Value {
    pub fn encode(&self) -> (u8, [u8; 4]) {
        match *self {
            Value::None => (0x00, [0; 4]),
            Value::U32(v) => (0x01, v.to_le_bytes()),
            Value::I32(v) => (0x02, v.to_le_bytes()),
            Value::F32(v) => (0x03, v.to_le_bytes()),
            Value::Bool(v) => (0x04, [v as u8, 0, 0, 0]),
        }
    }

    pub fn decode(value_type: u8, raw: [u8; 4]) -> Value {
        match value_type {
            0x01 => Value::U32(u32::from_le_bytes(raw)),
            0x02 => Value::I32(i32::from_le_bytes(raw)),
            0x03 => Value::F32(f32::from_le_bytes(raw)),
            0x04 => Value::Bool(raw[0] != 0),
            _ => Value::None,
        }
    }
}

#[derive(Clone, Copy, Debug, Serialize)]
pub struct Response {
    pub status: u8,
    pub value: Value,
}

