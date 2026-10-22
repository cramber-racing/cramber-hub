use std::sync::atomic::{AtomicBool, AtomicI32, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::Duration;

use hidapi::HidApi;

use super::hid::{USB_PID, USB_VID};


const GENERIC_DESKTOP: u16 = 0x01;
const JOYSTICK_USAGE: u16 = 0x04;
const JOYSTICK_REPORT_ID: u8 = 1;

const X_AXIS_OFFSET: usize = 9;
const READ_TIMEOUT_MS: i32 = 500;
const RETRY_DELAY: Duration = Duration::from_secs(1);

#[derive(Default, Clone)]
pub struct Joystick {
    axis: Arc<AtomicI32>,
    reading: Arc<AtomicBool>,
}

impl Joystick {
    pub fn axis(&self) -> Option<f32> {
        self.reading
            .load(Ordering::Relaxed)
            .then(|| self.axis.load(Ordering::Relaxed) as f32 / i16::MAX as f32)
    }

    pub fn start(&self) {
        let this = self.clone();
        thread::spawn(move || loop {
            this.read_until_lost();
            this.reading.store(false, Ordering::Relaxed);
            thread::sleep(RETRY_DELAY);
        });
    }

    fn read_until_lost(&self) {
        let Ok(api) = HidApi::new() else { return };
        let Some(info) = api.device_list().find(|d| {
            d.vendor_id() == USB_VID
                && d.product_id() == USB_PID
                && d.usage_page() == GENERIC_DESKTOP
                && d.usage() == JOYSTICK_USAGE
        }) else {
            return;
        };
        let Ok(dev) = info.open_device(&api) else { return };

        let mut buf = [0u8; 64];
        loop {
            match dev.read_timeout(&mut buf, READ_TIMEOUT_MS) {
                Ok(n) if n >= X_AXIS_OFFSET + 2 && buf[0] == JOYSTICK_REPORT_ID => {
                    let x = i16::from_le_bytes([buf[X_AXIS_OFFSET], buf[X_AXIS_OFFSET + 1]]);
                    self.axis.store(x as i32, Ordering::Relaxed);
                    self.reading.store(true, Ordering::Relaxed);
                }
                Ok(_) => {}
                Err(_) => return,
            }
        }
    }
}
