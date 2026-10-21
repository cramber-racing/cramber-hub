<script lang="ts">
import { tooltip } from "$lib/app/tooltip";
import { profiles } from "$lib/profiles/profiles.svelte";

let open = $state(false);
let root: HTMLDivElement;

async function choose(id: string) {
	open = false;
	if (id !== profiles.activeId) await profiles.activate(id);
}

function onWindowClick(e: MouseEvent) {
	if (open && !root.contains(e.target as Node)) open = false;
}
function onWindowKey(e: KeyboardEvent) {
	if (e.key === "Escape") open = false;
}
</script>

<svelte:window onclick={onWindowClick} onkeydown={onWindowKey} />

<div class="relative" bind:this={root}>
	<button
		type="button"
		aria-haspopup="listbox"
		aria-expanded={open}
		onclick={() => (open = !open)}
		class="flex h-14 w-64 cursor-pointer items-center justify-between gap-6 rounded-full border bg-card pr-5 pl-6 text-left transition-colors hover:border-foreground/40
			{open ? 'border-foreground/40' : ''}"
	>
		<span class="flex min-w-0 flex-1 flex-col">
			<span class="font-mono text-[9px] tracking-[0.2em] text-muted-foreground uppercase">
				Profile{#if profiles.autoGame}<span class="ml-1.5 text-primary" use:tooltip={"Switched automatically for the running game"}>· Auto</span>{/if}
			</span>
			<span class="truncate text-sm font-bold tracking-widest uppercase" use:tooltip={{ text: profiles.activeName, overflowOnly: true }}>{profiles.activeName}</span>
		</span>
        
		<svg
			width="12"
			height="12"
			viewBox="0 0 10 10"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			class="shrink-0 text-muted-foreground transition-transform duration-200 {open ? 'rotate-180' : ''}"
		>
			<path d="M1 3l4 4 4-4" />
		</svg>
	</button>

	{#if open}
		<div
			role="listbox"
			aria-label="Profiles"
			class="absolute top-full right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border bg-card py-2 shadow-2xl shadow-black/40"
		>
			{#each profiles.list as profile (profile.id)}
				{@const active = profile.id === profiles.activeId}
				<button
					type="button"
					role="option"
					aria-selected={active}
					onclick={() => choose(profile.id)}
					class="flex w-full cursor-pointer items-center justify-between gap-3 px-5 py-3 text-left transition-colors hover:bg-muted"
				>
					<span class="truncate text-sm font-bold tracking-widest uppercase {active ? 'text-primary' : 'text-card-foreground'}" use:tooltip={{ text: profile.name, overflowOnly: true }}>
						{profile.name}
					</span>
					{#if active}<span class="size-1.5 shrink-0 rounded-full bg-primary"></span>{/if}
				</button>
			{/each}

			<div class="mt-2 border-t pt-2">
				<a
					href="/profiles"
					onclick={() => (open = false)}
					class="block px-5 py-3 font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase no-underline transition-colors hover:bg-muted hover:text-foreground"
				>
					Manage profiles →
				</a>
			</div>
		</div>
	{/if}
</div>
