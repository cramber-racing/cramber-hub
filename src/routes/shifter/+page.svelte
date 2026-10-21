<script lang="ts">
import DeviceHero from "$lib/components/devices/DeviceHero.svelte";
import DevicePage from "$lib/components/layout/DevicePage.svelte";
import Card from "$lib/components/ui/Card.svelte";
import Notice from "$lib/components/ui/Notice.svelte";
import SegmentedControl from "$lib/components/ui/SegmentedControl.svelte";
import SliderControl from "$lib/components/ui/SliderControl.svelte";
import ToggleControl from "$lib/components/ui/ToggleControl.svelte";
import { type Gear, gearLabel, shifter } from "$lib/devices/shifter.svelte";

const W = 320;
const TOP = 34;
const MID = 110;
const BOTTOM = 186;
const colX = (i: number, n: number) => 50 + (i * (W - 100)) / (n - 1);

const layout = $derived(shifter.layout);
const knob = $derived.by(() => {
	for (const [i, [top, bottom]] of layout.entries()) {
		const x = colX(i, layout.length);
		if (top === shifter.gear) return { x, y: TOP };
		if (bottom === shifter.gear) return { x, y: BOTTOM };
	}
	return { x: W / 2, y: MID };
});
</script>

<DevicePage title="Shifter">
	{#snippet hero()}
		<DeviceHero name="Cramber Shifter" watermark="SH" preview={shifter.preview}>

			<div class="relative flex flex-1 flex-col items-center justify-center gap-8 py-8">
				{#if shifter.mode === "h-pattern"}
					<svg viewBox="0 0 {W} 220" class="w-full max-w-md">
						<line x1={colX(0, layout.length)} y1={MID} x2={colX(layout.length - 1, layout.length)} y2={MID} stroke="var(--border)" stroke-width="10" stroke-linecap="round" />
						{#each layout as [top, bottom], i}
							{@const x = colX(i, layout.length)}
							<line x1={x} y1={top !== null ? TOP : MID} x2={x} y2={bottom !== null ? BOTTOM : MID} stroke="var(--border)" stroke-width="10" stroke-linecap="round" />
						{/each}

						<circle cx={knob.x} cy={knob.y} r="26" fill="var(--primary)" fill-opacity="0.15" class="transition-all duration-300" />

						{#each layout as [top, bottom], i}
							{@const x = colX(i, layout.length)}
							{#each [[top, TOP], [bottom, BOTTOM]] as [gear, y]}
								{#if gear !== null}
									{@const active = shifter.gear === gear}
									<g role="button" tabindex="0" class="cursor-pointer" onclick={() => shifter.select(gear as Gear)} onkeydown={(e) => e.key === "Enter" && shifter.select(gear as Gear)}>
										<circle cx={x} cy={y} r="17" fill={active ? "var(--primary)" : "var(--card)"} stroke={active ? "var(--primary)" : "var(--muted-foreground)"} stroke-width="1.5" class="transition-colors" />
										<text x={x} y={(y as number) + 5} text-anchor="middle" font-size="14" font-weight="700" class="font-mono" fill={active ? "var(--primary-foreground)" : "var(--foreground)"}>
											{gearLabel(gear as Gear)}
										</text>
									</g>
								{/if}
							{/each}
						{/each}

						<g role="button" tabindex="0" class="cursor-pointer" onclick={() => shifter.select(0)} onkeydown={(e) => e.key === "Enter" && shifter.select(0)}>
							<text x={W / 2} y={MID + 4} text-anchor="middle" font-size="10" class="font-mono" fill={shifter.gear === 0 ? "var(--primary)" : "var(--muted-foreground)"}>N</text>
						</g>
					</svg>
				{:else}
					<div class="flex items-center gap-10">
						<div class="flex flex-col items-center gap-3">
							<button
								type="button"
								aria-label={shifter.invertSequential ? "Shift down" : "Shift up"}
								onclick={() => (shifter.invertSequential ? shifter.shiftDown() : shifter.shiftUp())}
								class="grid size-12 cursor-pointer place-items-center rounded-full border font-mono text-lg transition-colors hover:border-foreground"
							>
								{shifter.invertSequential ? "−" : "+"}
							</button>
							<div class="h-28 w-2.5 rounded-full bg-border"></div>
							<button
								type="button"
								aria-label={shifter.invertSequential ? "Shift up" : "Shift down"}
								onclick={() => (shifter.invertSequential ? shifter.shiftUp() : shifter.shiftDown())}
								class="grid size-12 cursor-pointer place-items-center rounded-full border font-mono text-lg transition-colors hover:border-foreground"
							>
								{shifter.invertSequential ? "+" : "−"}
							</button>
						</div>
						<div class="font-mono text-[10px] leading-relaxed tracking-widest text-muted-foreground uppercase">
							Push: {shifter.invertSequential ? "down" : "up"}<br />Pull: {shifter.invertSequential ? "up" : "down"}
						</div>
					</div>
				{/if}
			</div>

			<div class="relative flex items-end justify-between border-t pt-6">
				<div>
					<p class="mb-1 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Gear</p>
					<span class="font-display text-7xl leading-none font-bold tracking-tighter {shifter.gear === 0 ? 'text-muted-foreground' : 'text-primary'}">
						{gearLabel(shifter.gear)}
					</span>
				</div>
				<div class="text-right">
					<p class="mb-1 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Mode</p>
					<span class="text-sm font-bold tracking-widest uppercase">
						{shifter.mode === "h-pattern" ? `H · ${shifter.gears}+R` : "Sequential"}
					</span>
				</div>
			</div>
		</DeviceHero>
	{/snippet}

	{#if shifter.preview}
		<Notice title="Preview mode">No Cramber Shifter connected. Click the gears on the diagram to try the settings.</Notice>
	{/if}

	<Card title="Mode">
		<SegmentedControl
			label="Shifter mode"
			description="Match the plate fitted to the shifter."
			options={[
				{ value: "h-pattern", label: "H-Pattern" },
				{ value: "sequential", label: "Sequential" },
			]}
			value={shifter.mode}
			onchange={(m) => {
				shifter.mode = m;
				shifter.select(0);
			}}
		/>
	</Card>

	{#if shifter.mode === "h-pattern"}
		<Card title="H-Pattern">
			<div class="space-y-6">
				<SegmentedControl
					label="Gears"
					description="Forward gears on the gate."
					options={[
						{ value: 6, label: "6 + R" },
						{ value: 7, label: "7 + R" },
					]}
					value={shifter.gears}
					onchange={(g) => {
						shifter.gears = g;
						shifter.select(0);
					}}
				/>
				<SegmentedControl
					label="Reverse position"
					description="Where reverse sits on the gate."
					options={[
						{ value: "left", label: "Left" },
						{ value: "right", label: "Right" },
					]}
					value={shifter.reverse}
					onchange={(r) => {
						shifter.reverse = r;
						shifter.select(0);
					}}
				/>
				<SliderControl
					label="Engage Point"
					description="How deep into the gate a gear registers."
					value={shifter.engageThreshold}
					min={20}
					max={90}
					unit="%"
					oncommit={(v) => (shifter.engageThreshold = v)}
				/>
			</div>
		</Card>
	{:else}
		<Card title="Sequential">
			<ToggleControl
				label="Invert direction"
				description="Push for downshift, pull for upshift (rally style)."
				checked={shifter.invertSequential}
				onchange={(on) => (shifter.invertSequential = on)}
			/>
		</Card>
	{/if}

	<Card title="Response">
		<SliderControl
			label="Shift Debounce"
			description="Ignores contact bounce. Raise it if gears flicker on engagement."
			value={shifter.debounceMs}
			min={0}
			max={50}
			unit="ms"
			oncommit={(v) => (shifter.debounceMs = v)}
		/>
	</Card>
</DevicePage>
