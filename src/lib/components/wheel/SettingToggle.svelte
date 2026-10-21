<script lang="ts">
import ToggleControl from "$lib/components/ui/ToggleControl.svelte";
import { SETTINGS, type ToggleKey } from "$lib/devices/settings";
import { wheel } from "$lib/devices/wheelbase.svelte";

// On/off switch for one wheel setting; label and description come from SETTINGS.
let { key }: { key: ToggleKey } = $props();
</script>

<ToggleControl
	label={SETTINGS[key].label}
	description={SETTINGS[key].description}
	checked={wheel.values[key]}
	onchange={(on) => wheel.set(key, on)}
/>
