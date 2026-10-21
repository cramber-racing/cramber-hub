import type { CurveSettings } from "./curve";

export type PedalType = "clutch" | "brake" | "throttle";

export interface Pedal extends CurveSettings {
	label: string;
	connected: boolean;
	color: string;
	filter: number;
}

class Pedals {
	preview = true;
	active = $state<PedalType>("brake");

	pedals = $state<Record<PedalType, Pedal>>({
		clutch: {
			label: "Clutch",
			connected: false,
			color: "#2563EB",
			raw: 0,
			preset: "linear",
			minDeadzone: 0,
			maxDeadzone: 100,
			filter: 5,
		},
		brake: {
			label: "Brake",
			connected: true,
			color: "#DC2626",
			raw: 62,
			preset: "progressive",
			minDeadzone: 2,
			maxDeadzone: 95,
			filter: 3,
		},
		throttle: {
			label: "Throttle",
			connected: true,
			color: "var(--foreground)",
			raw: 75,
			preset: "aggressive",
			minDeadzone: 0,
			maxDeadzone: 100,
			filter: 5,
		},
	});

	get current(): Pedal {
		return this.pedals[this.active];
	}

	select = (pedal: PedalType) => {
		this.active = pedal;
	};

	update = (patch: Partial<Pedal>) => {
		Object.assign(this.pedals[this.active], patch);
	};
}

export const pedals = new Pedals();
