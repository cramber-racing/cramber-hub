import { invoke } from "@tauri-apps/api/core";

export enum Status {
	Ok = 0x00,
	UnknownParam = 0x01,
	Busy = 0x02,
	InvalidValue = 0x03,
	NotCalibrated = 0x04,
	CalibrationFailed = 0x05,
	InProgress = 0x06,
	PowerFault = 0x07,
	DriverFault = 0x08,
	AccessDenied = 0x09,
}

export enum ParamId {
	// Status (read-only)
	FwVersion = 0x0001,
	ConfigSchemaVersion = 0x0002,
	MotorCalibrated = 0x0602,
	EncoderCalibrated = 0x0704,
	AnticoggingCalibrated = 0x0901,
	DrvHasFault = 0xff02,
	ArmFailReason = 0xff05,
	HomingFailReason = 0xff0a,
	HomingInProgress = 0xff0b,
	AxisState = 0xff0e,
	PositionReferenced = 0xff0f,
	GameFfbActive = 0xff13,
	WheelAngleDeg = 0xff14,

	// User (RAM only)
	SteeringRangeDeg = 0x0a02,
	FfbActive = 0x0c01,
	IdleSpringStiffness = 0x0c04,
	IdleSpringDamping = 0x0c05,
	FfbGain = 0x0c06,
	FfbDetail = 0x0c07,
	NaturalDamping = 0x0c08,
	NaturalFriction = 0x0c09,
	NaturalInertia = 0x0c0a,
	BumpstopEnabled = 0x0d00,
	BumpstopRangeDeg = 0x0d01,
	BumpstopStiffness = 0x0d02,
	BumpstopDamping = 0x0d03,
	StartupSoundPlay = 0x0e02,

	// User, persisted on the device
	IdleSpringEnabled = 0x0c03,
	StartupSoundEnabled = 0x0e00,
}

export const CALTYPE_HOME = 0xfe02;

export enum AxisState {
	Idle = 0,
	CalibratingEncoder = 1,
	Homing = 2,
	CalibratingAnticogging = 3,
	Running = 4,
	Error = 5,
}

export type Value =
	| { type: "none" }
	| { type: "u32"; value: number }
	| { type: "i32"; value: number }
	| { type: "f32"; value: number }
	| { type: "bool"; value: boolean };

export interface Response {
	status: Status;
	value: Value;
}

export const f32 = (value: number): Value => ({ type: "f32", value });
export const bool = (value: boolean): Value => ({ type: "bool", value });

export function responseValue(response: Response): number | boolean | null {
	if (response.status !== Status.Ok || response.value.type === "none")
		return null;
	return response.value.value;
}

export const connect = () => invoke<boolean>("connect");
export const isConnected = () => invoke<boolean>("is_connected");
export const getSerial = () => invoke<string | null>("get_serial");
export const getParam = (id: ParamId) => invoke<Response>("get_param", { id });
export const getWheelAxis = () => invoke<number | null>("get_wheel_axis");
export const getParams = (ids: ParamId[]) =>
	invoke<Response[]>("get_params", { ids });
export const getDefaults = (ids: ParamId[]) =>
	invoke<Response[]>("get_defaults", { ids });
export const setParam = (id: ParamId, value: Value) =>
	invoke<Response>("set_param", { id, value });
export const calibrate = (caltype: number) =>
	invoke<Response>("calibrate", { caltype });
export const clearFault = () => invoke<Response>("clear_fault");
export const reboot = () => invoke<void>("reboot");

export interface FirmwareInfo {
	version: number;
	size: number;
}
export type UpdateStage =
	| "restarting"
	| "erasing"
	| "writing"
	| "verifying"
	| "starting";
export interface UpdateProgress {
	stage: UpdateStage;
	progress: number;
}
export const inspectFirmware = (path: string) =>
	invoke<FirmwareInfo>("inspect_firmware", { path });
export const bootloaderPresent = () => invoke<boolean>("bootloader_present");
export const updateFirmware = (path: string) =>
	invoke<void>("update_firmware", { path });

/** Firmware versions are packed as (major << 16) | (minor << 8) | patch. */
export const formatFirmwareVersion = (packed: number) =>
	`${packed >>> 16}.${(packed >>> 8) & 0xff}.${packed & 0xff}`;
