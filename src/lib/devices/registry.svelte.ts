import { wheel } from "./wheelbase.svelte";

export type DeviceKind = "wheel" | "pedals" | "shifter" | "handbrake";

export interface DeviceInfo {
	kind: DeviceKind;
	name: string;
	href: string;
}

export const DEVICE_LIST: DeviceInfo[] = [
	{ kind: "wheel", name: "Cramber DD", href: "/wheel-base" },
	{ kind: "pedals", name: "Cramber Pedals", href: "/pedals" },
	{ kind: "shifter", name: "Cramber Shifter", href: "/shifter" },
	{ kind: "handbrake", name: "Cramber Handbrake", href: "/handbrake" },
];

class Devices {
	isConnected(kind: DeviceKind): boolean {
		return kind === "wheel" && wheel.connected;
	}

	get connected(): number {
		return DEVICE_LIST.filter((d) => this.isConnected(d.kind)).length;
	}

	get total(): number {
		return DEVICE_LIST.length;
	}
}

export const devices = new Devices();
