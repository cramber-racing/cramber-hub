import {
	type AxisState,
	bool,
	clearFault,
	connect,
	getDefaults,
	getParam,
	getParams,
	getWheelAxis,
	isConnected,
	ParamId,
	responseValue,
	Status,
	setParam,
	type Value,
} from "./protocol";
import {
	encodeSetting,
	INITIAL_VALUES,
	PROFILE_KEYS,
	type ProfileKey,
	SETTING_KEYS,
	SETTINGS,
	type SettingKey,
	type SettingValue,
	type SettingValues,
	type UserSettings,
} from "./settings";

const STATUS_IDS = [
	ParamId.FwVersion,
	ParamId.AxisState,
	ParamId.PositionReferenced,
	ParamId.MotorCalibrated,
	ParamId.EncoderCalibrated,
	ParamId.DrvHasFault,
	ParamId.GameFfbActive,
	ParamId.FfbActive,
];
const SETTING_IDS = SETTING_KEYS.map((k) => SETTINGS[k].param);
const SETTINGS_EVERY_N_POLLS = 7;

const STATUS_MS_VISIBLE = 300;
const STATUS_MS_HIDDEN = 2000;
const ANGLE_MS = 16;
const ANGLE_MS_IN_GAME = 50;
const ANGLE_MS_HIDDEN = 500;
const ERROR_SHOWN_MS = 6000;
const WRITE_SETTLE_MS = 1000;

function describeStatus(status: Status): string {
	switch (status) {
		case Status.NotCalibrated:
			return "The base isn't ready yet. Power-cycle it; if this keeps happening, contact support.";
		case Status.Busy:
			return "The base is busy with another operation. Try again in a moment.";
		case Status.PowerFault:
			return "Supply voltage is out of range. Check the power supply.";
		case Status.DriverFault:
			return "The motor driver reported a fault. Clear faults, or power-cycle the base.";
		case Status.InvalidValue:
			return "That value is out of range.";
		case Status.AccessDenied:
		case Status.UnknownParam:
			return "This firmware doesn't support that setting. Update the base firmware.";
		default:
			return `The base rejected the request (${Status[status]}).`;
	}
}

const isProfileKey = (key: SettingKey): key is ProfileKey =>
	SETTINGS[key].profile;

const sameValue = (a: number | boolean, b: number | boolean) =>
	typeof a === "number" && typeof b === "number"
		? Math.abs(a - b) < 1e-4
		: a === b;

class WheelBase {
	connected = $state(false);
	error = $state<string | null>(null);
	fwVersion = $state<number | null>(null);
	wheelAngle = $state(0);
	axisState = $state<AxisState | null>(null);
	homed = $state(false);
	calibrated = $state(false);
	driverFault = $state(false);
	gameFfb = $state(false);
	ffbActive = $state(false);

	values = $state<SettingValues>({ ...INITIAL_VALUES });
	get #values(): Record<SettingKey, number | boolean> {
		return this.values;
	}

	defaults = $state<Partial<UserSettings>>({});

	onUserChange: ((settings: UserSettings) => void) | null = null;
	onConnect: (() => void) | null = null;

	get settings(): UserSettings {
		const out = {} as Record<ProfileKey, number | boolean>;
		for (const key of PROFILE_KEYS) out[key] = this.values[key];
		return out as UserSettings;
	}

	set = <K extends SettingKey>(key: K, value: SettingValue<K>) => {
		this.#values[key] = value;
		if (isProfileKey(key)) this.onUserChange?.(this.settings);
		return this.#write(SETTINGS[key].param, encodeSetting(key, value));
	};

	async applySettings(settings: Partial<UserSettings>) {
		for (const key of PROFILE_KEYS) {
			const value = settings[key];
			if (value === undefined) continue;
			this.#values[key] = value;
			if (this.connected)
				await this.#write(SETTINGS[key].param, encodeSetting(key, value));
		}
	}

	isDefault(keys: ProfileKey[]): boolean {
		return keys.every((key) => {
			const d = this.defaults[key];
			return d === undefined || sameValue(this.values[key], d);
		});
	}

	async resetSettings(keys: ProfileKey[]) {
		for (const key of keys) {
			const d = this.defaults[key];
			if (d !== undefined) await this.set(key, d);
		}
	}

	playSound = () => this.#write(ParamId.StartupSoundPlay, bool(true));

	async clearFaults() {
		try {
			await clearFault();
		} catch {
			this.#fail("Couldn't reach the base.");
		}
	}

	#statusTimer: ReturnType<typeof setTimeout> | undefined;
	#angleTimer: ReturnType<typeof setTimeout> | undefined;
	#errorTimer: ReturnType<typeof setTimeout> | undefined;
	#running = false;
	#busy = false;
	#pollCount = 0;
	#lastWrite = 0;
	#defaultsLoading = false;

	get #visible() {
		return document.visibilityState === "visible";
	}

	start() {
		if (this.#running) return;
		this.#running = true;
		this.#statusLoop();
		this.#angleLoop();
	}

	stop() {
		this.#running = false;
		clearTimeout(this.#statusTimer);
		clearTimeout(this.#angleTimer);
	}

	#statusLoop = async () => {
		if (!this.#running) return;
		await this.#poll();
		this.#statusTimer = setTimeout(
			this.#statusLoop,
			this.#visible ? STATUS_MS_VISIBLE : STATUS_MS_HIDDEN,
		);
	};

	#angleLoop = async () => {
		if (!this.#running) return;
		let fromJoystick = false;
		if (this.connected && this.#visible) {
			try {
				const axis = await getWheelAxis();
				if (axis !== null) {
					this.wheelAngle = (axis * this.values.steeringRangeDeg) / 2;
					fromJoystick = true;
				} else {
					const angle = responseValue(await getParam(ParamId.WheelAngleDeg));
					if (typeof angle === "number") this.wheelAngle = angle;
				}
			} catch {}
		}
		const delay = !this.#visible
			? ANGLE_MS_HIDDEN
			: this.gameFfb && !fromJoystick
				? ANGLE_MS_IN_GAME
				: ANGLE_MS;
		this.#angleTimer = setTimeout(this.#angleLoop, delay);
	};

	async #poll() {
		if (this.#busy) return;
		this.#busy = true;
		const wasConnected = this.connected;
		try {
			if (!this.connected) this.connected = await connect();

			const withSettings =
				!wasConnected || this.#pollCount++ % SETTINGS_EVERY_N_POLLS === 0;
			const ids = withSettings ? [...STATUS_IDS, ...SETTING_IDS] : STATUS_IDS;
			const responses = await getParams(ids);
			const v = (id: ParamId) => responseValue(responses[ids.indexOf(id)]);

			const fw = v(ParamId.FwVersion);
			this.fwVersion = typeof fw === "number" ? fw : null;
			const axis = v(ParamId.AxisState);
			this.axisState = typeof axis === "number" ? (axis as AxisState) : null;
			this.homed = v(ParamId.PositionReferenced) === true;
			this.calibrated =
				v(ParamId.MotorCalibrated) === true &&
				v(ParamId.EncoderCalibrated) === true;
			this.driverFault = v(ParamId.DrvHasFault) === true;
			this.gameFfb = v(ParamId.GameFfbActive) === true;
			this.ffbActive = v(ParamId.FfbActive) === true;

			if (withSettings && performance.now() - this.#lastWrite > WRITE_SETTLE_MS)
				this.#readSettings(v);
			if (!wasConnected && this.connected) this.onConnect?.();
			if (withSettings && Object.keys(this.defaults).length === 0)
				void this.#loadDefaults();
		} catch {
			this.connected = await isConnected().catch(() => false);
			if (!this.connected) this.defaults = {};
		} finally {
			this.#busy = false;
		}
	}

	#readSettings(v: (id: ParamId) => number | boolean | null) {
		for (const key of SETTING_KEYS) {
			const value = v(SETTINGS[key].param);
			if (value !== null) this.#values[key] = value;
		}
	}

	async #loadDefaults() {
		if (this.#defaultsLoading) return;
		this.#defaultsLoading = true;
		try {
			const responses = await getDefaults(
				PROFILE_KEYS.map((k) => SETTINGS[k].param),
			);
			const defaults: Record<string, number | boolean> = {};
			PROFILE_KEYS.forEach((key, i) => {
				const v = responseValue(responses[i]);
				if (v !== null) defaults[key] = v;
			});
			this.defaults = defaults as Partial<UserSettings>;
		} catch {
		} finally {
			this.#defaultsLoading = false;
		}
	}

	#fail(message: string) {
		this.error = message;
		clearTimeout(this.#errorTimer);
		this.#errorTimer = setTimeout(() => (this.error = null), ERROR_SHOWN_MS);
	}

	async #write(id: ParamId, value: Value): Promise<boolean> {
		this.#lastWrite = performance.now();
		try {
			const r = await setParam(id, value);
			if (r.status !== Status.Ok) {
				this.#fail(describeStatus(r.status));
				return false;
			}
			return true;
		} catch {
			this.#fail("Couldn't reach the base.");
			return false;
		}
	}
}

export const wheel = new WheelBase();
