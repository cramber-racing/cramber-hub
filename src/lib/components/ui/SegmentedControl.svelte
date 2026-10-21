<script lang="ts" generics="T extends string | number">
let {
	label,
	description = "",
	options,
	value,
	onchange,
}: {
	label: string;
	description?: string;
	options: { value: T; label: string }[];
	value: T;
	onchange: (value: T) => void;
} = $props();
</script>

<div class="flex items-center justify-between gap-6">
	<div class="min-w-0">
		<span class="mb-0.5 block text-xs font-bold tracking-widest uppercase">{label}</span>
		{#if description}
			<span class="font-mono text-[10px] text-muted-foreground">{description}</span>
		{/if}
	</div>

	<div class="flex shrink-0 rounded-full border p-1" role="radiogroup" aria-label={label}>
		{#each options as option}
			{@const selected = option.value === value}
			<button
				type="button"
				role="radio"
				aria-checked={selected}
				onclick={() => onchange(option.value)}
				class="h-8 cursor-pointer rounded-full px-4 font-mono text-[10px] tracking-[0.15em] uppercase transition-colors
					{selected ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}"
			>
				{option.label}
			</button>
		{/each}
	</div>
</div>
