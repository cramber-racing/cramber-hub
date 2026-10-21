import { type CurveSettings, curveOutput } from "./curve";

export type HandbrakeMode = "analog" | "digital";

interface HandbrakeSettings extends CurveSettings {
	mode: HandbrakeMode;
	threshold: number;
	filter: number;
}

class Handbrake {
	preview = true;
	connected = $state(true);
	color = "#F59E0B";

	s = $state<HandbrakeSettings>({
		raw: 58,
		preset: "linear",
		minDeadzone: 3,
		maxDeadzone: 97,
		mode: "analog",
		threshold: 40,
		filter: 4,
	});

	get output(): number {
		if (this.s.mode === "digital")
			return this.s.raw >= this.s.threshold ? 100 : 0;
		return curveOutput(this.s);
	}

	update = (patch: Partial<HandbrakeSettings>) => {
		Object.assign(this.s, patch);
	};

	setRaw = (raw: number) => {
		this.s.raw = Math.min(Math.max(raw, 0), 100);
	};
}

export const handbrake = new Handbrake();
