<script lang="ts">
import { tooltip } from "$lib/app/tooltip";
import type { ProfileKey } from "$lib/devices/settings";
import { wheel } from "$lib/devices/wheelbase.svelte";

// Restores the base's factory defaults for a group of settings.
let { keys }: { keys: ProfileKey[] } = $props();

const known = $derived(keys.some((k) => wheel.defaults[k] !== undefined));
const atDefault = $derived(known && wheel.isDefault(keys));
const reason = $derived(
	!wheel.connected
		? "Connect the base to reset"
		: !known
			? "Factory defaults unavailable -- update the base firmware"
			: atDefault
				? "Already at factory defaults"
				: "Restore this section's factory defaults",
);
</script>

<span class="inline-flex" use:tooltip={reason}>
	<button
		type="button"
		disabled={!wheel.connected || !known || atDefault}
		onclick={() => wheel.resetSettings(keys)}
		class="flex h-8 cursor-pointer items-center gap-2 rounded-full border px-4 font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase transition-colors hover:border-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-30 disabled:hover:border-border disabled:hover:text-muted-foreground"
	>
		<svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
			<path d="M2 6a4 4 0 1 0 1.2-2.85M2 1.5V4h2.5" />
		</svg>
		Reset
	</button>
</span>
