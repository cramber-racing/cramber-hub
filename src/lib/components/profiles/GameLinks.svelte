<script lang="ts">
import { tooltip } from "$lib/app/tooltip";
import { pickExecutable } from "$lib/profiles/file";
import { gameName, KNOWN_GAMES } from "$lib/profiles/games";
import { type Profile, profiles } from "$lib/profiles/profiles.svelte";

let { profile }: { profile: Profile } = $props();

let open = $state(false);
let root: HTMLDivElement;

const linked = $derived(profile.games ?? []);
const ownerOf = (exe: string) =>
	profiles.list.find((p) => p.id !== profile.id && p.games?.includes(exe));

async function link(exe: string) {
	open = false;
	await profiles.linkGame(profile.id, exe);
}

async function linkOther() {
	open = false;
	const exe = await pickExecutable();
	if (exe) await profiles.linkGame(profile.id, exe);
}

function onWindowClick(e: MouseEvent) {
	if (open && !root.contains(e.target as Node)) open = false;
}
</script>

<svelte:window onclick={onWindowClick} onkeydown={(e) => e.key === "Escape" && (open = false)} />

<div class="flex flex-col gap-2">
	<span class="font-mono text-[9px] tracking-widest text-muted-foreground uppercase">Auto-switch for</span>

	<div class="flex flex-wrap items-center gap-1.5" bind:this={root}>
		{#each linked as exe (exe)}
			<span class="flex h-7 items-center gap-1.5 rounded-full border pr-1.5 pl-3 font-mono text-[10px] tracking-wider" use:tooltip={exe}>
				{gameName(exe)}
				<button
					type="button"
					aria-label="Unlink {gameName(exe)}"
					onclick={() => profiles.unlinkGame(profile.id, exe)}
					class="grid size-4 cursor-pointer place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
				>
					<svg width="8" height="8" viewBox="0 0 10 10" stroke="currentColor" stroke-width="1.5">
                        <path d="M2 2l6 6M8 2L2 8" />
                    </svg>
				</button>
			</span>
		{/each}

		<div class="relative">
			<button
				type="button"
				aria-haspopup="listbox"
				aria-expanded={open}
				onclick={() => (open = !open)}
				class="flex h-7 cursor-pointer items-center gap-1 rounded-full border border-dashed px-3 font-mono text-[10px] tracking-wider text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
			>
				+ {linked.length ? "Game" : "Link a game"}
			</button>

			{#if open}
				<div
					role="listbox"
					aria-label="Games"
					class="absolute top-full left-0 z-50 mt-2 max-h-72 w-64 overflow-y-auto rounded-2xl border bg-card py-2 shadow-2xl shadow-black/40"
				>
					{#each KNOWN_GAMES.filter((g) => !linked.includes(g.exe)) as game}
						{@const owner = ownerOf(game.exe)}
						<button
							type="button"
							role="option"
							aria-selected="false"
							onclick={() => link(game.exe)}
							use:tooltip={owner ? `Linked to "${owner.name}" -- picking it moves it here` : game.exe}
							class="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-2 text-left text-xs transition-colors hover:bg-muted"
						>
							<span class="truncate">{game.name}</span>
							{#if owner}<span class="shrink-0 font-mono text-[9px] text-muted-foreground uppercase">in use</span>{/if}
						</button>
					{/each}
					<div class="mt-2 border-t pt-2">
						<button
							type="button"
							onclick={linkOther}
							class="w-full cursor-pointer px-4 py-2 text-left font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase transition-colors hover:bg-muted hover:text-foreground"
						>
							Other .exe…
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
