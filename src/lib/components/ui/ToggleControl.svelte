<script lang="ts">
let {
	label,
	description = "",
	checked,
	disabled = false,
	onchange,
}: {
	label: string;
	description?: string;
	checked: boolean;
	disabled?: boolean;
	onchange: (on: boolean) => void;
} = $props();
</script>

<button
	type="button"
	role="switch"
	aria-checked={checked}
	{disabled}
	class="group flex w-full cursor-pointer items-center justify-between gap-4 text-left transition-opacity disabled:pointer-events-none disabled:opacity-40"
	onclick={() => onchange(!checked)}
>
	<span>
		<span class="mb-0.5 block text-xs font-bold tracking-widest uppercase">{label}</span>
		{#if description}
			<span class="font-mono text-[10px] text-muted-foreground">{description}</span>
		{/if}
	</span>

	<span class="flex shrink-0 items-center gap-3">
		<span class="w-10 text-right font-display text-xl font-bold tracking-tighter {checked ? '' : 'text-muted-foreground'}">
			{checked ? "On" : "Off"}
		</span>

		<span class="relative flex h-5 w-9 items-center rounded-full border transition-colors duration-200 {checked ? 'border-foreground' : ''}">
			<span
				class="absolute size-3 rounded-full transition-all duration-200 group-hover:scale-125
					{checked ? 'left-4.5 bg-foreground' : 'left-0.75 bg-muted-foreground'}"
			></span>
		</span>
	</span>
</button>
