export type CurvePreset = "linear" | "progressive" | "aggressive" | "s-curve";

export interface CurveSettings {
	raw: number;
	preset: CurvePreset;
	minDeadzone: number;
	maxDeadzone: number;
}

export const CURVE_PRESETS: {
	id: CurvePreset;
	label: string;
	description: string;
}[] = [
	{
		id: "linear",
		label: "Linear",
		description: "Output follows travel 1:1.",
	},
	{
		id: "progressive",
		label: "Progressive",
		description: "Gentle at first, strong at the end.",
	},
	{
		id: "aggressive",
		label: "Aggressive",
		description: "Strong early response.",
	},
	{
		id: "s-curve",
		label: "S-Curve",
		description: "Fine control in the middle of the travel.",
	},
];

const SHAPES: Record<CurvePreset, (t: number) => number> = {
	linear: (t) => t,
	progressive: (t) => t ** 1.8,
	aggressive: (t) => t ** 0.55,
	"s-curve": (t) => t * t * (3 - 2 * t),
};

export function curveOutput(s: CurveSettings, raw = s.raw): number {
	if (raw <= s.minDeadzone) return 0;
	if (raw >= s.maxDeadzone) return 100;
	const t = (raw - s.minDeadzone) / (s.maxDeadzone - s.minDeadzone);
	return SHAPES[s.preset](t) * 100;
}

export function curvePoints(
	s: CurveSettings,
	samples = 50,
): { x: number; y: number }[] {
	return Array.from({ length: samples + 1 }, (_, i) => {
		const x = (i / samples) * 100;
		return { x, y: curveOutput(s, x) };
	});
}
