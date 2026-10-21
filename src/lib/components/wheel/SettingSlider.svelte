<script lang="ts">
import SliderControl from "$lib/components/ui/SliderControl.svelte";
import { type NumberKey, SETTINGS, type SettingDef } from "$lib/devices/settings";
import { wheel } from "$lib/devices/wheelbase.svelte";

// Slider for one numeric wheel setting; label, range and units come from SETTINGS.
let { key, disabled = false }: { key: NumberKey; disabled?: boolean } = $props();

const def = $derived<SettingDef>(SETTINGS[key]);
// Percent settings are 0..1 on the base and 0..100 on screen.
const scale = $derived(def.kind === "percent" ? 100 : 1);
</script>

<SliderControl
	label={def.label}
	description={def.description}
	value={wheel.values[key] * scale}
	min={def.kind === "degrees" ? def.min : 0}
	max={def.kind === "degrees" ? def.max : 100}
	step={def.kind === "degrees" ? (def.step ?? 1) : 1}
	unit={def.kind === "percent" ? "%" : "°"}
	{disabled}
	oncommit={(v) => wheel.set(key, v / scale)}
/>
