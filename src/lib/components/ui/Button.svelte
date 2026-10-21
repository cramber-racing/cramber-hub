<script lang="ts">
import type { Snippet } from "svelte";

let {
    variant = "outline",
	disabled = false,
	onclick,
	children,
}: {
	variant?: "outline" | "solid" | "danger";
	disabled?: boolean;
	onclick?: () => void;
	children: Snippet;
} = $props();

const VARIANTS = {
	outline: "border hover:border-foreground",
	solid: "bg-foreground text-background hover:bg-primary hover:text-primary-foreground",
	danger: "border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground",
};
</script>

<button
	type="button"
	{disabled}
	{onclick}
	class="flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full px-5 font-mono text-[10px] font-semibold tracking-[0.2em] uppercase transition-colors disabled:pointer-events-none disabled:opacity-30 {VARIANTS[variant]}"
>
	{@render children()}
</button>
