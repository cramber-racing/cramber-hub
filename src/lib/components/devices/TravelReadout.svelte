<script lang="ts">
let {
	travel,
	output,
	outputLabel = "Output",
	outputUnit = "%",
	color,
}: {
	travel: string;
	output: string;
	outputLabel?: string;
	outputUnit?: string;
	color: string;
} = $props();
</script>

<div class="flex items-end justify-between">
	<div>
		<p class="mb-1 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Travel</p>
		<span class="font-display text-5xl font-bold tracking-tighter tabular-nums">
			{travel}<span class="ml-1 text-xl text-muted-foreground">%</span>
		</span>
	</div>
	<svg width="28" height="12" viewBox="0 0 28 12" fill="none" stroke="currentColor" stroke-width="1.5" class="mb-4 text-muted-foreground">
		<path d="M0 6h26M21 1l5 5-5 5" />
	</svg>
	<div class="text-right">
		<p class="mb-1 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">{outputLabel}</p>
		<span class="font-display text-5xl font-bold tracking-tighter tabular-nums" style="color: {color}">
			{output}{#if outputUnit}<span class="ml-1 text-xl text-muted-foreground">{outputUnit}</span>{/if}
		</span>
	</div>
</div>
