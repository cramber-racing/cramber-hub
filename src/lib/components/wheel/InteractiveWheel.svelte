<script lang="ts">
let { angle, range = 900 }: { angle: number; range?: number } = $props();

const RIM_R = 84;
const DIAL_R = 108;
const SWEEP = 135;

const fraction = $derived(Math.min(Math.max(angle / Math.max(range / 2, 1), -1), 1));

function polar(r: number, deg: number): [number, number] {
	const a = (deg * Math.PI) / 180;
	return [r * Math.sin(a), -r * Math.cos(a)];
}

function arc(from: number, to: number, r: number): string {
	const [x1, y1] = polar(r, from);
	const [x2, y2] = polar(r, to);
	const large = Math.abs(to - from) > 180 ? 1 : 0;
	const sweep = to > from ? 1 : 0;
	return `M${x1} ${y1}A${r} ${r} 0 ${large} ${sweep} ${x2} ${y2}`;
}

const ticks = Array.from({ length: 19 }, (_, i) => -SWEEP + (i * 2 * SWEEP) / 18);

const bolts = Array.from({ length: 6 }, (_, i) => {
	const a = (i * Math.PI) / 3;
	return [22 * Math.sin(a), -22 * Math.cos(a)];
});
</script>

<div class="flex flex-col items-center gap-4 py-4">
	<svg class="size-64" viewBox="-124 -124 248 248" aria-hidden="true">
		<path d={arc(-SWEEP, SWEEP, DIAL_R)} fill="none" stroke="currentColor" stroke-opacity="0.12" stroke-width="3" stroke-linecap="round" />
		{#each ticks as t, i}
			{@const major = i % 9 === 0}
			{@const [x1, y1] = polar(major ? 114 : 116, t)}
			{@const [x2, y2] = polar(120, t)}
			<line {x1} {y1} {x2} {y2} stroke="currentColor" stroke-opacity={major ? 0.6 : 0.25} stroke-width={major ? 2 : 1.25} stroke-linecap="round" />
		{/each}

		{#if Math.abs(fraction) > 0.002}
			<path d={arc(0, fraction * SWEEP, DIAL_R)} fill="none" stroke="var(--primary)" stroke-width="3" stroke-linecap="round" />
		{/if}

		<text x={polar(100, -SWEEP)[0]} y={polar(100, -SWEEP)[1] + 14} text-anchor="middle" font-size="9" class="font-mono" fill="currentColor" fill-opacity="0.5">L</text>
		<text x={polar(100, SWEEP)[0]} y={polar(100, SWEEP)[1] + 14} text-anchor="middle" font-size="9" class="font-mono" fill="currentColor" fill-opacity="0.5">R</text>

		<g style="transform: rotate({angle}deg)">
			<circle r={RIM_R} fill="none" stroke="currentColor" stroke-width="17" />
			<path d={arc(-4, 4, RIM_R)} fill="none" stroke="var(--primary)" stroke-width="17" />

			<path
				d="M-80 -9Q0 -40 80 -9L80 13Q34 15 19 42L15 80H-15L-19 42Q-34 15 -80 13Z"
				fill="currentColor"
				fill-opacity="0.85"
			/>

			{#each bolts as [cx, cy]}
				<circle {cx} {cy} r="2.8" fill="var(--hero)" />
			{/each}
			<circle r="15" fill="currentColor" stroke="var(--hero)" stroke-opacity="0.25" stroke-width="3" />
			<g transform="translate(-7 -6.5) scale(0.07)" fill="var(--primary)">
				<path d="M0 83.1818L59.5721 186.364H139.682L179.572 117.273H99.9011L80.4812 83.6363H159.682L199.572 14.5454H39.6272L0 83.1818Z" />
			</g>
		</g>
	</svg>

	<span class="font-mono text-3xl font-bold tracking-widest tabular-nums">{angle.toFixed(1)}°</span>
</div>
