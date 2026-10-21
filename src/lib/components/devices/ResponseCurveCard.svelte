<script lang="ts">
import { tooltip } from "$lib/app/tooltip";
import Card from "$lib/components/ui/Card.svelte";
import {
	CURVE_PRESETS,
	type CurvePreset,
	type CurveSettings,
	curveOutput,
	curvePoints,
} from "$lib/devices/curve";

let {
	settings,
	color,
	label,
	live = true,
	onpreset,
}: {
	settings: CurveSettings;
	color: string;
	label: string;
	live?: boolean;
	onpreset: (preset: CurvePreset) => void;
} = $props();

const output = $derived(curveOutput(settings));
const points = $derived(
	curvePoints(settings)
		.map((p) => `${p.x},${100 - p.y}`)
		.join(" "),
);
</script>

<Card title="Response Curve">
	{#snippet action()}
		<span class="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] uppercase">
			<span class="size-1.5 rounded-full" style="background: {color}"></span>{label}
		</span>
	{/snippet}

	<div class="mb-6 grid grid-cols-2 gap-2 xl:grid-cols-4" role="radiogroup" aria-label="Curve">
		{#each CURVE_PRESETS as preset}
			{@const selected = settings.preset === preset.id}
			<button
				type="button"
				role="radio"
				aria-checked={selected}
				use:tooltip={preset.description}
				onclick={() => onpreset(preset.id)}
				class="h-10 cursor-pointer rounded-full border font-mono text-[10px] tracking-[0.15em] uppercase transition-colors
					{selected ? 'border-foreground bg-foreground text-background' : 'text-muted-foreground hover:border-muted-foreground hover:text-foreground'}"
			>
				{preset.label}
			</button>
		{/each}
	</div>

	<div class="flex gap-3">
		<div class="flex flex-col justify-between pb-6 font-mono text-[9px] text-muted-foreground">
			<span>100</span><span>50</span><span>0</span>
		</div>

		<div class="flex-1">
			<div class="relative">
				<svg class="aspect-2/1 w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
					{#if settings.minDeadzone > 0}
						<rect x="0" y="0" width={settings.minDeadzone} height="100" fill="var(--muted)" />
					{/if}
					{#if settings.maxDeadzone < 100}
						<rect x={settings.maxDeadzone} y="0" width={100 - settings.maxDeadzone} height="100" fill="var(--muted)" />
					{/if}

					{#each [25, 50, 75] as g}
						<line x1={g} y1="0" x2={g} y2="100" stroke="var(--border)" vector-effect="non-scaling-stroke" />
						<line x1="0" y1={g} x2="100" y2={g} stroke="var(--border)" vector-effect="non-scaling-stroke" />
					{/each}
					<rect x="0" y="0" width="100" height="100" fill="none" stroke="var(--border)" vector-effect="non-scaling-stroke" />

					<line x1="0" y1="100" x2="100" y2="0" stroke="var(--muted-foreground)" stroke-dasharray="4 4" vector-effect="non-scaling-stroke" />

					<polyline {points} fill="none" stroke={color} stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke" />

					{#if live}
						<line x1={settings.raw} y1="100" x2={settings.raw} y2={100 - output} stroke={color} stroke-opacity="0.4" stroke-dasharray="2 3" vector-effect="non-scaling-stroke" />
						<line x1="0" y1={100 - output} x2={settings.raw} y2={100 - output} stroke={color} stroke-opacity="0.4" stroke-dasharray="2 3" vector-effect="non-scaling-stroke" />
					{/if}
				</svg>

				{#if live}
					<span
						class="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-card"
						style="left: {settings.raw}%; top: {100 - output}%; background: {color}"
					></span>
				{/if}
			</div>

			<div class="mt-2 flex justify-between font-mono text-[9px] text-muted-foreground">
				<span>0</span><span>Travel →</span><span>100</span>
			</div>
		</div>
	</div>
</Card>
