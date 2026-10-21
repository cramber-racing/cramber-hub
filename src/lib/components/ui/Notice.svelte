<script lang="ts">
import type { Snippet } from "svelte";

let {
	title,
	tone = "neutral",
	children,
	action,
}: {
	title: string;
	tone?: "neutral" | "danger";
	children: Snippet;
	action?: Snippet;
} = $props();
</script>

<div
	role={tone === "danger" ? "alert" : "status"}
	class="flex items-center justify-between gap-4 rounded-3xl p-5
		{tone === 'danger' ? 'border border-destructive/40 bg-destructive/10' : 'border border-dashed'}"
>
	<div class="flex items-center gap-4">
		<span class="size-2 shrink-0 rounded-full {tone === 'danger' ? 'bg-destructive' : 'bg-muted-foreground'}"></span>
		<div>
			<p class="text-xs font-bold tracking-widest uppercase {tone === 'danger' ? 'text-destructive' : ''}">{title}</p>
			<p class="mt-1 font-mono text-[10px] text-muted-foreground">{@render children()}</p>
		</div>
	</div>
	{@render action?.()}
</div>
