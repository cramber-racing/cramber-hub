<script lang="ts">
import DeviceHero from "$lib/components/devices/DeviceHero.svelte";
import ResponseCurveCard from "$lib/components/devices/ResponseCurveCard.svelte";
import TravelReadout from "$lib/components/devices/TravelReadout.svelte";
import DevicePage from "$lib/components/layout/DevicePage.svelte";
import Card from "$lib/components/ui/Card.svelte";
import Notice from "$lib/components/ui/Notice.svelte";
import SliderControl from "$lib/components/ui/SliderControl.svelte";
import { curveOutput } from "$lib/devices/curve";
import { type PedalType, pedals } from "$lib/devices/pedals.svelte";

const SIZE: Record<PedalType, string> = {
	clutch: "w-16 h-44",
	brake: "w-20 h-44",
	throttle: "w-16 h-60",
};
const ORDER: PedalType[] = ["clutch", "brake", "throttle"];

const current = $derived(pedals.current);
const output = $derived(curveOutput(current));
const tint = (color: string, pct: number) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;
</script>

<DevicePage title="Pedals">
	{#snippet hero()}
		<DeviceHero name="Cramber Pedals" watermark="LC" watermarkSide="left" preview={pedals.preview}>
			<div class="relative flex flex-1 items-end justify-center gap-10 py-10" role="tablist" aria-label="Pedal">
				{#each ORDER as name}
					{@const pedal = pedals.pedals[name]}
					{@const active = pedals.active === name}
					{@const out = pedal.connected ? curveOutput(pedal) : 0}
					<button
						type="button"
						role="tab"
						aria-selected={active}
						onclick={() => pedals.select(name)}
						class="group flex cursor-pointer flex-col items-center gap-4 {pedal.connected ? '' : 'opacity-40'}"
					>
						<span class="font-mono text-xs font-bold tabular-nums {active ? '' : 'text-muted-foreground'}">
							{pedal.connected ? `${Math.round(out)}%` : "—"}
						</span>

						<span
							class="relative flex overflow-hidden rounded-2xl border-2 transition-all duration-300 {SIZE[name]}
								{active ? 'scale-105' : 'border-border group-hover:border-muted-foreground'}"
							style="background: {tint(pedal.color, 8)}; {active ? `border-color: ${pedal.color};` : ''}"
						>
							<span
								class="absolute inset-x-0 bottom-0 transition-[height] duration-150"
								style="height: {out}%; background: {pedal.color}"
							></span>
						</span>

						<span class="flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase {active ? '' : 'text-muted-foreground'}">
							<span class="size-1.5 rounded-full" style="background: {pedal.connected ? pedal.color : 'var(--muted-foreground)'}"></span>
							{pedal.label}
						</span>
					</button>
				{/each}
			</div>

			<div class="relative border-t pt-6">
				<div class="mb-4 flex items-center justify-between">
					<span class="font-display text-2xl font-bold tracking-tighter uppercase">{current.label}</span>
					<span class="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
						{current.connected ? "Connected" : "Not connected"}
					</span>
				</div>

				<TravelReadout
					travel={current.connected ? String(Math.round(current.raw)) : "—"}
					output={current.connected ? String(Math.round(output)) : "—"}
					color={current.color}
				/>
			</div>
		</DeviceHero>
	{/snippet}

	{#if pedals.preview}
		<Notice title="Preview mode">No Cramber Pedals connected. The values here are examples so you can explore the settings.</Notice>
	{/if}

	<div class="flex flex-col gap-6 transition-opacity {current.connected ? '' : 'pointer-events-none opacity-30'}">
		<ResponseCurveCard
			settings={current}
			color={current.color}
			label={current.label}
			live={current.connected}
			onpreset={(preset) => pedals.update({ preset })}
		/>

		<Card title="Calibration">
			<div class="grid grid-cols-1 gap-x-12 gap-y-6 xl:grid-cols-2">
				<SliderControl
					label="Start Deadzone"
					description="Travel ignored at the start of the stroke."
					value={current.minDeadzone}
					max={40}
					unit="%"
					oncommit={(v) => pedals.update({ minDeadzone: v })}
				/>
				<SliderControl
					label="End Deadzone"
					description="Full output before the end of the stroke."
					value={100 - current.maxDeadzone}
					max={40}
					unit="%"
					oncommit={(v) => pedals.update({ maxDeadzone: 100 - v })}
				/>
				<SliderControl
					label="Smoothing"
					description="Filters out signal jitter. Higher adds a little delay."
					value={current.filter}
					max={10}
					oncommit={(v) => pedals.update({ filter: v })}
				/>
			</div>
		</Card>
	</div>
</DevicePage>
