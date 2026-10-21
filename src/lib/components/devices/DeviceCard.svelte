<script lang="ts">
import type { Snippet } from "svelte";

let {
	index,
	name,
	version = null,
	connected,
	stats = [],
	href,
	icon,
}: {
	index: number;
	name: string;
	version?: string | null;
	connected: boolean;
	stats?: { label: string; value: string }[];
	href: string;
	icon: Snippet;
} = $props();
</script>

<a
    {href}
    class="group relative rounded-4xl p-8 bg-card text-card-foreground flex flex-col justify-between transition-all duration-500 min-h-100 overflow-hidden group cursor-pointer border
    {connected ? '' : 'opacity-50 grayscale'}"
>
    <span class="absolute -right-4 -top-4 text-[8em] xl:text-[10em] font-display font-bold leading-none opacity-5 pointer-events-none text-foreground">
        {String(index).padStart(2, "0")}
    </span>

    <div>
        <div class="flex items-center justify-between mb-8">
            <span class="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">{version ?? "—"}</span>
            <span class="size-2 rounded-full {connected ? 'bg-primary' : 'bg-foreground'}"></span>
        </div>

        <div class="relative mb-6">{@render icon()}</div>

        <h3 class="text-2xl font-display font-bold tracking-tighter leading-none mb-2">
        {#each name.split(" ") as word}
            <span class="block">{word}</span>
        {/each}
        </h3>
    </div>
    
    {#if connected}
    <div class="flex items-center justify-between border-t pt-6"> 
        <div class="flex gap-6">
            {#if stats.length}
            {#each stats as stat}
            <div class="flex flex-col">
                <span class="text-[9px] uppercase tracking-widest font-mono mb-1 text-muted-foreground">
                    {stat.label}
                </span>
                <span class="text-sm font-bold tracking-widest">
                    {stat.value}
                </span>
            </div>
            {/each}
            {/if}
        </div>
		
        <div class="size-10 rounded-full border flex items-center justify-center transition-transform group-hover:scale-110">
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M1 7h12M8 2l5 5-5 5" />
            </svg>
        </div>
    </div>
    {/if}
</a>