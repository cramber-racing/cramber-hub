export type ShifterMode = "h-pattern" | "sequential";

export type Gear = number;

export const gearLabel = (g: Gear) =>
	g === -1 ? "R" : g === 0 ? "N" : String(g);

class Shifter {
	preview = true;
	connected = $state(true);

	gear = $state<Gear>(3);

	mode = $state<ShifterMode>("h-pattern");
	gears = $state<6 | 7>(6);
	reverse = $state<"left" | "right">("right");
	engageThreshold = $state(60);
	invertSequential = $state(false);
	debounceMs = $state(15);

	get layout(): [Gear | null, Gear | null][] {
		if (this.gears === 6) {
			return this.reverse === "right"
				? [
						[1, 2],
						[3, 4],
						[5, 6],
						[null, -1],
					]
				: [
						[-1, null],
						[1, 2],
						[3, 4],
						[5, 6],
					];
		}
		return this.reverse === "right"
			? [
					[1, 2],
					[3, 4],
					[5, 6],
					[7, -1],
				]
			: [
					[-1, 1],
					[2, 3],
					[4, 5],
					[6, 7],
				];
	}

	get topGear(): number {
		return this.gears;
	}

	select = (gear: Gear) => {
		this.gear = gear;
	};

	shiftUp = () => {
		this.gear = this.gear === -1 ? 0 : Math.min(this.gear + 1, this.topGear);
	};

	shiftDown = () => {
		this.gear = this.gear <= 0 ? -1 : this.gear - 1;
	};
}

export const shifter = new Shifter();
