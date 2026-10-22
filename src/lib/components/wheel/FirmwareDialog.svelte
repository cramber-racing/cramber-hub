<script lang="ts">
import Button from "$lib/components/ui/Button.svelte";
import { firmware, STAGE_LABEL } from "$lib/devices/firmware.svelte";
import type { UpdateStage } from "$lib/devices/protocol";
import { wheel } from "$lib/devices/wheelbase.svelte";

const STAGE_SPAN: Record<UpdateStage, [number, number]> = {
	restarting: [0, 5],
	erasing: [5, 15],
	writing: [15, 95],
	verifying: [95, 98],
	starting: [98, 100],
};

const s = $derived(firmware.state);
const percent = $derived.by(() => {
	if (s.step !== "running") return 0;
	const [from, to] = STAGE_SPAN[s.stage];
	return Math.round(from + (to - from) * s.progress);
});
const kb = (bytes: number) => `${Math.round(bytes / 1024)} KB`;
</script>

<svelte:window onkeydown={(e) => e.key === "Escape" && firmware.close()} />

{#if s.step !== "idle"}
	<div class="fixed inset-0 z-50 grid place-items-center bg-black/60 p-6 backdrop-blur-sm">
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="firmware-title"
			class="w-full max-w-lg rounded-4xl border bg-card p-8 text-card-foreground shadow-2xl shadow-black/40"
		>
			{#if s.step === "confirm"}
				<h3 id="firmware-title" class="mb-4 font-display text-2xl font-bold tracking-tighter uppercase">Update firmware</h3>
				<p class="text-sm">
					Install firmware <strong>V{s.file.version}</strong> ({kb(s.file.size)}) on the Cramber DD{wheel.fwVersion !== null
						? `, now running V${wheel.fwVersion}`
						: ""}.
				</p>
				<p class="mt-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
					Keep the base plugged in and powered until it finishes. Calibration and settings are kept.
				</p>
				<div class="mt-8 flex justify-end gap-3">
					<Button onclick={() => firmware.close()}>Cancel</Button>
					<Button variant="solid" onclick={() => firmware.install()}>Install</Button>
				</div>
			{:else if s.step === "running"}
				<h3 id="firmware-title" class="mb-6 font-display text-2xl font-bold tracking-tighter uppercase">Updating firmware</h3>
				<div class="mb-2 flex items-baseline justify-between gap-4">
					<span class="text-xs font-bold tracking-widest uppercase">{STAGE_LABEL[s.stage]}</span>
					<span class="font-display text-xl font-bold tracking-tighter tabular-nums">{percent}%</span>
				</div>
				<div class="h-1.5 overflow-hidden rounded-full bg-muted">
					<div class="h-full rounded-full bg-primary transition-[width] duration-300" style="width: {percent}%"></div>
				</div>
				<p class="mt-6 font-mono text-[10px] text-muted-foreground">Don't unplug the base.</p>
			{:else if s.step === "done"}
				<h3 id="firmware-title" class="mb-4 font-display text-2xl font-bold tracking-tighter uppercase">Firmware updated</h3>
				<p class="text-sm">The Cramber DD is now running <strong>V{s.file.version}</strong>.</p>
				<div class="mt-8 flex justify-end">
					<Button variant="solid" onclick={() => firmware.close()}>Done</Button>
				</div>
			{:else if s.step === "failed"}
				<h3 id="firmware-title" class="mb-4 font-display text-2xl font-bold tracking-tighter text-destructive uppercase">
					Update failed
				</h3>
				<p class="text-sm">{s.error}</p>
				<p class="mt-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
					The base is safe: if the update didn't finish, it waits in update mode until you try again.
				</p>
				<div class="mt-8 flex justify-end gap-3">
					<Button onclick={() => firmware.close()}>Close</Button>
					<Button variant="solid" onclick={() => firmware.install()}>Try again</Button>
				</div>
			{/if}
		</div>
	</div>
{/if}
