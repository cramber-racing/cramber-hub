<script lang="ts">
import {
	isEnabled as autostartEnabled,
	disable as disableAutostart,
	enable as enableAutostart,
} from "@tauri-apps/plugin-autostart";
import { onMount } from "svelte";
import { type ThemeMode, theme } from "$lib/app/theme.svelte";
import { updater } from "$lib/app/updater.svelte";
import Button from "$lib/components/ui/Button.svelte";
import PageHeader from "$lib/components/layout/PageHeader.svelte";
import Card from "$lib/components/ui/Card.svelte";
import ToggleControl from "$lib/components/ui/ToggleControl.svelte";
import { profiles } from "$lib/profiles/profiles.svelte";

const OPTIONS: { mode: ThemeMode; label: string; description: string }[] = [
	{
		mode: "dark",
		label: "Dark",
		description: "Black interface, easy on the eyes in a dim rig.",
	},
	{
		mode: "light",
		label: "Light",
		description: "Bright interface for well-lit rooms.",
	},
	{
		mode: "system",
		label: "System",
		description: "Follows the Windows light / dark setting.",
	},
];

const PREVIEW: Record<
	"dark" | "light",
	{ bg: string; card: string; line: string; text: string }
> = {
	dark: { bg: "#050505", card: "#111111", line: "#ffffff1a", text: "#ffffff" },
	light: { bg: "#f2f1ec", card: "#ffffff", line: "#00000014", text: "#0a0a0a" },
};

const variantsOf = (mode: ThemeMode): ("dark" | "light")[] =>
	mode === "system" ? ["dark", "light"] : [mode];

let startWithWindows = $state(false);
let autostartError = $state<string | null>(null);
onMount(async () => {
	try {
		startWithWindows = await autostartEnabled();
	} catch {
		autostartError = "Couldn't read the Windows startup setting.";
	}
});

async function setStartWithWindows(on: boolean) {
	autostartError = null;
	try {
		await (on ? enableAutostart() : disableAutostart());
		startWithWindows = await autostartEnabled();
	} catch (e) {
		autostartError = `Couldn't change the Windows startup setting: ${e instanceof Error ? e.message : String(e)}`;
	}
}
</script>

<PageHeader title="Settings" />

<div class="min-h-0 flex-1 overflow-y-auto p-6 lg:p-10">
	<div class="mx-auto flex w-full max-w-400 flex-col gap-6">
		<Card title="Appearance" description="Choose how Cramber Hub looks.">
			<div class="grid grid-cols-1 gap-6 md:grid-cols-3" role="radiogroup" aria-label="Theme">
				{#each OPTIONS as option}
					{@const selected = theme.mode === option.mode}
					<button
						type="button"
						role="radio"
						aria-checked={selected}
						onclick={() => theme.set(option.mode)}
						class="cursor-pointer rounded-3xl border p-4 text-left transition-colors
							{selected ? 'border-primary' : 'hover:border-muted-foreground/40'}"
					>
						<div class="mb-4 flex h-28 overflow-hidden rounded-2xl border">
							{#each variantsOf(option.mode) as variant}
								{@const c = PREVIEW[variant]}
								<div class="flex flex-1 gap-2 p-3" style="background: {c.bg}">
									<div class="w-1/4 rounded-md" style="background: {c.card}; border: 1px solid {c.line}"></div>
									<div class="flex flex-1 flex-col gap-2">
										<div class="h-2 w-1/2 rounded-full" style="background: {c.text}"></div>
										<div class="flex-1 rounded-md" style="background: {c.card}; border: 1px solid {c.line}"></div>
										<div class="h-1.5 w-3/4 rounded-full bg-primary"></div>
									</div>
								</div>
							{/each}
						</div>

						<div class="flex items-start justify-between gap-4 px-1">
							<div>
								<span class="mb-1 block text-xs font-bold tracking-widest uppercase">{option.label}</span>
								<span class="font-mono text-[10px] text-muted-foreground">{option.description}</span>
							</div>
							<span
								class="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors
									{selected ? 'border-primary' : ''}"
							>
								{#if selected}<span class="size-2 rounded-full bg-primary"></span>{/if}
							</span>
						</div>
					</button>
				{/each}
			</div>
		</Card>

		<Card title="Updates" description="New versions of Cramber Hub are installed from here.">
			<div class="flex items-center justify-between gap-6">
				<div class="min-w-0">
					{#if updater.available}
						<span class="mb-0.5 block text-xs font-bold tracking-widest text-primary uppercase">
							Version {updater.available.version} available
						</span>
						<span class="font-mono text-[10px] text-muted-foreground">
							You have {updater.currentVersion ?? "an older version"}. The app restarts to finish the update.
						</span>
					{:else}
						<span class="mb-0.5 block text-xs font-bold tracking-widest uppercase">
							Cramber Hub {updater.currentVersion ?? ""}
						</span>
						<span class="font-mono text-[10px] text-muted-foreground">
							{updater.checking
								? "Checking for updates…"
								: updater.lastChecked
									? `Up to date. Last checked at ${updater.lastChecked.toLocaleTimeString()}.`
									: "Checks for updates automatically."}
						</span>
					{/if}
				</div>

				{#if updater.available}
					<Button variant="solid" disabled={updater.installing} onclick={() => updater.install()}>
						{#if updater.installing}
							{updater.progress === null ? "Installing…" : `Downloading ${Math.round(updater.progress * 100)}%`}
						{:else}
							Install & restart
						{/if}
					</Button>
				{:else}
					<Button disabled={updater.checking} onclick={() => updater.check()}>Check for updates</Button>
				{/if}
			</div>

			{#if updater.available?.notes}
				<p class="mt-6 border-t pt-6 font-mono text-[10px] leading-relaxed whitespace-pre-line text-muted-foreground">
					{updater.available.notes}
				</p>
			{/if}
			{#if updater.error}
				<p class="mt-4 font-mono text-[10px] text-destructive">{updater.error}</p>
			{/if}
		</Card>

		<Card title="System" description="How Cramber Hub runs on this PC.">
			<ToggleControl
				label="Start with Windows"
				description="Opens in the system tray when you sign in, so your profile is on the base before you start a game."
				checked={startWithWindows}
				onchange={setStartWithWindows}
			/>
			{#if autostartError}
				<p class="mt-4 font-mono text-[10px] text-destructive">{autostartError}</p>
			{/if}
		</Card>

		<Card title="Profiles" description="How profiles follow your games.">
			<ToggleControl
				label="Auto-switch by game"
				description="When a game linked to a profile starts, switch to it; go back to the previous profile when it closes. Link games on the Profiles page."
				checked={profiles.autoSwitch}
				onchange={(on) => profiles.setAutoSwitch(on)}
			/>
		</Card>
	</div>
</div>
