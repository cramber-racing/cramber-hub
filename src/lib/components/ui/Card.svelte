<script lang="ts">
import type { Snippet } from "svelte";

let {
	title,
	description = "",
	action,
	children,
}: {
	title?: string;
	description?: string;
	action?: Snippet;
	children: Snippet;
} = $props();
</script>

<section class="rounded-4xl border bg-card p-8 text-card-foreground">
	{#if title}
		<div class="flex items-center justify-between gap-4 {description ? 'mb-8' : 'mb-6'}">
			<div class="min-w-0">
				<h3 class="font-display text-2xl font-bold tracking-tighter uppercase">{title}</h3>
				{#if description}
					<p class="mt-1 font-mono text-[10px] text-muted-foreground">{description}</p>
				{/if}
			</div>
			{@render action?.()}
		</div>
	{/if}
	{@render children()}
</section>
