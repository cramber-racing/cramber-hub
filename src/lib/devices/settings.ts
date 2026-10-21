import { bool, f32, ParamId, type Value } from "./protocol";

interface Common {
	param: ParamId;
	label: string;
	description: string;
	profile: boolean;
}
export interface PercentSetting extends Common {
	kind: "percent";
}
export interface DegreesSetting extends Common {
	kind: "degrees";
	min: number;
	max: number;
	step?: number;
}
export interface ToggleSetting extends Common {
	kind: "toggle";
}
export type SettingDef = PercentSetting | DegreesSetting | ToggleSetting;

export const SETTINGS = {
	ffbGain: {
		kind: "percent",
		param: ParamId.FfbGain,
		label: "Torque Gain",
		description: "Overall strength of the game's force feedback.",
		profile: true,
	},
	ffbDetail: {
		kind: "percent",
		param: ParamId.FfbDetail,
		label: "FFB Detail",
		description: "Road texture and small bumps. Lower is smoother.",
		profile: true,
	},
	steeringRangeDeg: {
		kind: "degrees",
		param: ParamId.SteeringRangeDeg,
		label: "Steering Range",
		description: "Total rotation, lock to lock. Match it to the car in game.",
		min: 90,
		max: 2700,
		step: 10,
		profile: true,
	},
	naturalDamping: {
		kind: "percent",
		param: ParamId.NaturalDamping,
		label: "Damping",
		description: "Resistance to fast wheel movements.",
		profile: true,
	},
	naturalFriction: {
		kind: "percent",
		param: ParamId.NaturalFriction,
		label: "Friction",
		description: "Constant resistance to turning.",
		profile: true,
	},
	naturalInertia: {
		kind: "percent",
		param: ParamId.NaturalInertia,
		label: "Inertia",
		description: "Simulated weight of the steering assembly.",
		profile: true,
	},
	idleSpringEnabled: {
		kind: "toggle",
		param: ParamId.IdleSpringEnabled,
		label: "Center when idle",
		description: "Holds the wheel centered while no game is running.",
		profile: false,
	},
	idleSpringStiffness: {
		kind: "percent",
		param: ParamId.IdleSpringStiffness,
		label: "Strength",
		description: "How hard it pulls back to center.",
		profile: true,
	},
	idleSpringDamping: {
		kind: "percent",
		param: ParamId.IdleSpringDamping,
		label: "Smoothing",
		description: "Stops the wheel overshooting as it returns.",
		profile: true,
	},
	bumpstopEnabled: {
		kind: "toggle",
		param: ParamId.BumpstopEnabled,
		label: "Virtual end stops",
		description: "A soft wall at the end of the steering range.",
		profile: true,
	},
	bumpstopStiffness: {
		kind: "percent",
		param: ParamId.BumpstopStiffness,
		label: "Hardness",
		description: "How firmly the wall stops the wheel.",
		profile: true,
	},
	bumpstopDamping: {
		kind: "percent",
		param: ParamId.BumpstopDamping,
		label: "Cushion",
		description: "Absorbs the hit as the wheel reaches the wall.",
		profile: true,
	},
	bumpstopRangeDeg: {
		kind: "degrees",
		param: ParamId.BumpstopRangeDeg,
		label: "Wall Width",
		description: "How gradually the wall builds up.",
		min: 1,
		max: 45,
		profile: true,
	},
	startupSoundEnabled: {
		kind: "toggle",
		param: ParamId.StartupSoundEnabled,
		label: "Startup sound",
		description:
			"Plays the Cramber chime when the base powers on. Saved on the base.",
		profile: false,
	},
} as const satisfies Record<string, SettingDef>;

export type SettingKey = keyof typeof SETTINGS;
export type ToggleKey = {
	[K in SettingKey]: (typeof SETTINGS)[K]["kind"] extends "toggle" ? K : never;
}[SettingKey];
export type NumberKey = Exclude<SettingKey, ToggleKey>;

export type SettingValue<K extends SettingKey> = K extends ToggleKey
	? boolean
	: number;
export type SettingValues = { [K in SettingKey]: SettingValue<K> };

/** Settings that live in a profile (the rest are persisted on the base). */
export type ProfileKey = {
	[K in SettingKey]: (typeof SETTINGS)[K]["profile"] extends true ? K : never;
}[SettingKey];
export type UserSettings = { [K in ProfileKey]: SettingValue<K> };

export const SETTING_KEYS = Object.keys(SETTINGS) as SettingKey[];
export const PROFILE_KEYS = SETTING_KEYS.filter(
	(k) => SETTINGS[k].profile,
) as ProfileKey[];

/** Shown until the base reports its own values. */
export const INITIAL_VALUES: SettingValues = {
	ffbGain: 1,
	ffbDetail: 1,
	steeringRangeDeg: 900,
	naturalDamping: 0,
	naturalFriction: 0,
	naturalInertia: 0,
	idleSpringEnabled: true,
	idleSpringStiffness: 0.2,
	idleSpringDamping: 0.1,
	bumpstopEnabled: true,
	bumpstopStiffness: 0.3,
	bumpstopDamping: 0.15,
	bumpstopRangeDeg: 10,
	startupSoundEnabled: true,
};

/** Valid range of a numeric setting, in the base's own units. */
export function settingRange(key: NumberKey): [number, number] {
	const def: SettingDef = SETTINGS[key];
	return def.kind === "degrees" ? [def.min, def.max] : [0, 1];
}

export const encodeSetting = (
	key: SettingKey,
	value: number | boolean,
): Value =>
	SETTINGS[key].kind === "toggle"
		? bool(value as boolean)
		: f32(value as number);

export function sanitizeSettings(
	raw: unknown,
	base: UserSettings,
): UserSettings {
	const out = { ...base };
	if (!raw || typeof raw !== "object") return out;
	const values = out as Record<ProfileKey, number | boolean>;

	for (const key of PROFILE_KEYS) {
		const v = (raw as Record<string, unknown>)[key];
		if (SETTINGS[key].kind === "toggle") {
			if (typeof v === "boolean") values[key] = v;
		} else if (typeof v === "number" && Number.isFinite(v)) {
			const [min, max] = settingRange(key as NumberKey);
			values[key] = Math.min(Math.max(v, min), max);
		}
	}
	return out;
}
