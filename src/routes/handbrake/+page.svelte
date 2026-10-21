<script lang="ts">
import DeviceHero from "$lib/components/devices/DeviceHero.svelte";
import ResponseCurveCard from "$lib/components/devices/ResponseCurveCard.svelte";
import TravelReadout from "$lib/components/devices/TravelReadout.svelte";
import DevicePage from "$lib/components/layout/DevicePage.svelte";
import Card from "$lib/components/ui/Card.svelte";
import Notice from "$lib/components/ui/Notice.svelte";
import SegmentedControl from "$lib/components/ui/SegmentedControl.svelte";
import SliderControl from "$lib/components/ui/SliderControl.svelte";
import { handbrake } from "$lib/devices/handbrake.svelte";

const s = $derived(handbrake.s);
const digital = $derived(s.mode === "digital");
const leverAngle = $derived(-55 + (s.raw / 100) * 55);
</script>

<DevicePage title="Handbrake">
	{#snippet hero()}
		<DeviceHero name="Cramber Handbrake" watermark="HB" preview={handbrake.preview}>
			<div class="relative flex flex-1 items-center justify-center gap-12 py-8">
				<svg viewBox="0 0 200 200" class="w-56">
					<line x1="30" y1="170" x2="170" y2="170" stroke="var(--border)" stroke-width="6" stroke-linecap="round" />
					<g style="transform: rotate({leverAngle}deg); transform-origin: 60px 160px" class="transition-transform duration-150">
						<line x1="60" y1="160" x2="60" y2="30" stroke="var(--foreground)" stroke-width="10" stroke-linecap="round" />
						<rect x="48" y="18" width="24" height="44" rx="12" fill={handbrake.color} />
					</g>
					<circle cx="60" cy="160" r="12" fill="var(--card)" stroke="var(--foreground)" stroke-width="3" />
				</svg>

				<div class="relative h-48 w-5 overflow-hidden rounded-full bg-muted">
					<div class="absolute inset-x-0 bottom-0 transition-[height] duration-150" style="height: {handbrake.output}%; background: {handbrake.color}"></div>
					{#if digital}
						<div class="absolute inset-x-0 h-0.5 bg-foreground" style="bottom: {s.threshold}%"></div>
					{/if}
				</div>
			</div>

			{#if handbrake.preview}
				<div class="relative mb-6">
					<SliderControl label="Try it" description="Pull the lever (preview only)." value={s.raw} unit="%" oncommit={() => {}} oninput={(v) => handbrake.setRaw(v)} />
				</div>
			{/if}

			<div class="relative border-t pt-6">
				<TravelReadout
					travel={String(Math.round(s.raw))}
					outputLabel={digital ? "Button" : "Output"}
					output={digital ? (handbrake.output > 0 ? "On" : "Off") : String(Math.round(handbrake.output))}
					outputUnit={digital ? "" : "%"}
					color={handbrake.color}
				/>
			</div>
		</DeviceHero>
	{/snippet}

	{#if handbrake.preview}
		<Notice title="Preview mode">No Cramber Handbrake connected. Use "Try it" to pull the lever and see the settings work.</Notice>
	{/if}

	<Card title="Mode">
		<SegmentedControl
			label="Output"
			description={digital
				? "Acts as a button, for games without an analog handbrake axis."
				: "Progressive axis, like a pedal. Best for drifting and rally."}
			options={[
				{ value: "analog", label: "Analog" },
				{ value: "digital", label: "Button" },
			]}
			value={s.mode}
			onchange={(mode) => handbrake.update({ mode })}
		/>
	</Card>

	{#if digital}
		<Card title="Button">
			<SliderControl
				label="Trigger Point"
				description="How far you pull before the button engages."
				value={s.threshold}
				min={5}
				max={95}
				unit="%"
				oncommit={(threshold) => handbrake.update({ threshold })}
			/>
		</Card>
	{:else}
		<ResponseCurveCard
			settings={s}
			color={handbrake.color}
			label="Handbrake"
			onpreset={(preset) => handbrake.update({ preset })}
		/>

		<Card title="Calibration">
			<div class="grid grid-cols-1 gap-x-12 gap-y-6 xl:grid-cols-2">
				<SliderControl
					label="Start Deadzone"
					description="Travel ignored at the start of the pull."
					value={s.minDeadzone}
					max={40}
					unit="%"
					oncommit={(minDeadzone) => handbrake.update({ minDeadzone })}
				/>
				<SliderControl
					label="End Deadzone"
					description="Full output before the end of the pull."
					value={100 - s.maxDeadzone}
					max={40}
					unit="%"
					oncommit={(v) => handbrake.update({ maxDeadzone: 100 - v })}
				/>
				<SliderControl
					label="Smoothing"
					description="Filters out signal jitter. Higher adds a little delay."
					value={s.filter}
					max={10}
					oncommit={(filter) => handbrake.update({ filter })}
				/>
			</div>
		</Card>
	{/if}
</DevicePage>
