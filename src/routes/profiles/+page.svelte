<script lang="ts">
import { tooltip } from "$lib/app/tooltip";
import PageHeader from "$lib/components/layout/PageHeader.svelte";
import GameLinks from "$lib/components/profiles/GameLinks.svelte";
import Button from "$lib/components/ui/Button.svelte";
import {
	PROFILE_NAME_MAX,
	type Profile,
	profiles,
} from "$lib/profiles/profiles.svelte";

let editingId = $state<string | null>(null);
let draftName = $state("");
let confirmDeleteId = $state<string | null>(null);

let notice = $state<{ text: string; error: boolean } | null>(null);
let noticeTimer: ReturnType<typeof setTimeout> | undefined;
function flash(text: string, error = false) {
	notice = { text, error };
	clearTimeout(noticeTimer);
	noticeTimer = setTimeout(() => (notice = null), 5000);
}

async function importFile() {
	try {
		const n = await profiles.importProfiles();
		if (n > 0) flash(`Imported ${n} profile${n === 1 ? "" : "s"}.`);
	} catch (e) {
		flash(e instanceof Error ? e.message : String(e), true);
	}
}

async function exportFile(ids?: string[]) {
	try {
		if (await profiles.exportProfiles(ids))
			flash(ids?.length === 1 ? "Profile exported." : "Profiles exported.");
	} catch (e) {
		flash(
			`Couldn't save the file: ${e instanceof Error ? e.message : String(e)}`,
			true,
		);
	}
}

function startRename(p: Profile) {
	editingId = p.id;
	draftName = p.name;
}

async function commitRename() {
	if (editingId) await profiles.rename(editingId, draftName);
	editingId = null;
}

async function createProfile() {
	await profiles.create(`Profile ${profiles.list.length + 1}`);
	const created = profiles.active;
	if (created) startRename(created);
}

function summary(p: Profile): { label: string; value: string }[] {
	const s = p.settings;
	if (!s) return [{ label: "Settings", value: "Not set yet" }];
	return [
		{ label: "Range", value: `${s.steeringRangeDeg.toFixed(0)}°` },
		{ label: "Gain", value: `${Math.round(s.ffbGain * 100)}%` },
		{ label: "Detail", value: `${Math.round(s.ffbDetail * 100)}%` },
	];
}

const ICON_BTN =
	"grid size-9 cursor-pointer place-items-center rounded-full border border-transparent text-muted-foreground transition-colors hover:border-border hover:text-foreground";

const focusOnMount = (node: HTMLElement) => {
	node.focus();
};

const focus = (node: HTMLInputElement) => {
	node.focus();
	node.select();
};
</script>

<PageHeader title="Profiles" />

<div class="min-h-0 flex-1 overflow-y-auto p-6 lg:p-10">
	<div class="mx-auto w-full max-w-400">
		<div class="mb-8 flex flex-wrap items-start justify-between gap-6">
			<p class="max-w-2xl font-mono text-[11px] leading-relaxed text-muted-foreground">
				Profiles are saved on this PC. The active profile is sent to the base every time it connects, and any
				change you make in the app is saved into it automatically.
			</p>

			<div class="flex shrink-0 gap-2">
				<Button onclick={importFile}>
					<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M8 2v8M4.5 6.5 8 10l3.5-3.5M2.5 11v2.5h11V11" />
					</svg>
					Import
				</Button>
				<Button onclick={() => exportFile()}>
					<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M8 10V2M4.5 5.5 8 2l3.5 3.5M2.5 11v2.5h11V11" />
					</svg>
					Export all
				</Button>
			</div>
		</div>

		{#if notice}
			<p class="-mt-4 mb-6 font-mono text-[11px] {notice.error ? 'text-destructive' : 'text-muted-foreground'}">
				{notice.text}
			</p>
		{/if}

		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
			{#each profiles.list as profile (profile.id)}
				{@const active = profile.id === profiles.activeId}
				<div
					class="relative flex min-h-64 flex-col rounded-4xl border bg-card p-8 text-card-foreground transition-colors
						{active ? 'border-primary' : 'hover:border-muted-foreground/40'}"
				>
					<div class="mb-6 flex items-center justify-between">
						<span class="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
							{new Date(profile.updatedAt).toLocaleDateString()}
						</span>
						{#if active}
							<span class="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-primary uppercase">
								<span class="size-1.5 rounded-full bg-primary"></span>Active
							</span>
						{/if}
					</div>

					{#if editingId === profile.id}
						<input
							use:focus
							bind:value={draftName}
							maxlength={PROFILE_NAME_MAX}
							onblur={commitRename}
							onkeydown={(e) => {
								if (e.key === "Enter") commitRename();
								if (e.key === "Escape") editingId = null;
							}}
							class="mb-6 w-full border-b border-primary bg-transparent pb-1 font-display text-2xl font-bold tracking-tighter uppercase outline-none"
						/>
					{:else}
						<button
							type="button"
							class="mb-6 w-full cursor-text truncate text-left font-display text-2xl font-bold tracking-tighter uppercase"
							use:tooltip={{ text: profile.name, overflowOnly: true }}
							ondblclick={() => startRename(profile)}
						>
							{profile.name}
						</button>
					{/if}

					<div class="mb-8 flex gap-6">
						{#each summary(profile) as stat}
							<div class="flex flex-col">
								<span class="mb-1 font-mono text-[9px] tracking-widest text-muted-foreground uppercase">{stat.label}</span>
								<span class="text-sm font-bold tracking-widest">{stat.value}</span>
							</div>
						{/each}
					</div>

					<div class="mb-8">
						<GameLinks {profile} />
					</div>

					<div class="mt-auto flex h-15 items-center justify-between gap-3 border-t pt-6">
						{#if active}
							<span class="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">In use</span>
						{:else}
							<button
								type="button"
								onclick={() => profiles.activate(profile.id)}
								class="h-9 cursor-pointer rounded-full bg-foreground px-6 font-mono text-[10px] font-semibold tracking-[0.2em] text-background uppercase transition-colors hover:bg-primary hover:text-primary-foreground"
							>
								Use
							</button>
						{/if}

						<div class="flex items-center gap-1">
							{#if confirmDeleteId === profile.id}
								<button
									type="button"
									onclick={() => {
										profiles.remove(profile.id);
										confirmDeleteId = null;
									}}
									use:focusOnMount
									onblur={() => (confirmDeleteId = null)}
									onkeydown={(e) => {
										if (e.key === "Escape") confirmDeleteId = null;
									}}
									class="h-9 cursor-pointer rounded-full bg-destructive px-4 font-mono text-[10px] tracking-[0.2em] text-destructive-foreground uppercase"
								>
									Delete?
								</button>
								<button
									type="button"
									onclick={() => (confirmDeleteId = null)}
									class="h-9 cursor-pointer rounded-full px-3 font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase hover:text-foreground"
								>
									Cancel
								</button>
							{:else}
								<button type="button" use:tooltip={"Rename"} aria-label="Rename" onclick={() => startRename(profile)} class={ICON_BTN}>
									<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round">
										<path d="M11 2.5l2.5 2.5L5.5 13H3v-2.5z" />
									</svg>
								</button>
								<button type="button" use:tooltip={"Duplicate"} aria-label="Duplicate" onclick={() => profiles.duplicate(profile.id)} class={ICON_BTN}>
									<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4">
										<rect x="5" y="5" width="8.5" height="8.5" rx="1.5" />
										<path d="M11 3V2.5A1.5 1.5 0 0 0 9.5 1h-6A1.5 1.5 0 0 0 2 2.5v6A1.5 1.5 0 0 0 3.5 10H4" />
									</svg>
								</button>
								<button type="button" use:tooltip={"Export"} aria-label="Export" onclick={() => exportFile([profile.id])} class={ICON_BTN}>
									<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
										<path d="M8 10V2M4.5 5.5 8 2l3.5 3.5M2.5 11v2.5h11V11" />
									</svg>
								</button>
								{#if profiles.list.length > 1}
									<button
										type="button"
										use:tooltip={"Delete"}
										aria-label="Delete"
										onclick={() => (confirmDeleteId = profile.id)}
										class="{ICON_BTN} hover:border-destructive hover:text-destructive"
									>
										<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
											<path d="M2.5 4h11M6 4V2.5h4V4M4 4l.7 9.5h6.6L12 4" />
										</svg>
									</button>
								{/if}
							{/if}
						</div>
					</div>
				</div>
			{/each}

			<button
				type="button"
				onclick={createProfile}
				class="flex min-h-64 cursor-pointer flex-col items-center justify-center gap-4 rounded-4xl border border-dashed text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
			>
				<span class="text-4xl leading-none font-light">+</span>
				<span class="font-mono text-[10px] tracking-[0.2em] uppercase">New profile from current settings</span>
			</button>
		</div>
	</div>
</div>
