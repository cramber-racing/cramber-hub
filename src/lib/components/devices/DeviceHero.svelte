<script lang="ts">
import type { Snippet } from "svelte";

let {
	name,
	watermark,
	watermarkSide = "right",
	tone = "card",
	preview = false,
	badges,
	children,
}: {
	name: string;
	watermark: string;
	watermarkSide?: "left" | "right";
	tone?: "card" | "hero";
	preview?: boolean;
	badges?: Snippet;
	children: Snippet;
} = $props();
</script>

<div
	class="relative flex flex-1 flex-col overflow-hidden rounded-4xl p-8
		{tone === 'hero' ? 'bg-hero text-hero-foreground' : 'border bg-card text-card-foreground'}"
>
	<div
		class="pointer-events-none absolute -top-8 font-display text-[12rem] leading-none font-bold opacity-5
			{watermarkSide === 'left' ? '-left-8' : '-right-8'}"
	>
		{watermark}
	</div>

	<div class="relative flex items-center justify-between">
		<span class="font-mono text-[10px] tracking-[0.2em] uppercase {tone === 'card' ? 'text-muted-foreground' : ''}">
			{name}
		</span>
		{#if badges}
			{@render badges()}
		{:else if preview}
			<span class="rounded-full border px-3 py-1 font-mono text-[9px] tracking-widest text-muted-foreground uppercase">
				Preview
			</span>
		{/if}
	</div>

	{@render children()}
</div>
