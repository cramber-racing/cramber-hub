<script lang="ts">
import type { DeviceKind } from "$lib/devices/registry.svelte";

let { kind }: { kind: DeviceKind } = $props();
</script>

<svg width="48" height="48" viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
	{#if kind === "wheel"}
		<circle cx="22" cy="22" r="18" stroke-dasharray="6 5" />
	{:else if kind === "pedals"}
		<path d="M14 8c-3 0-4 3-4 6 0 4 2 6 2 9s-1 5 0 7c1 3 5 3 6 0 1-2-1-5-1-8s2-5 2-9c0-3-2-5-5-5Z" />
		<path d="M30 14c-3 0-5 2-5 5 0 4 2 6 2 9s-2 5-1 8c1 2 5 2 6 0 1-3-1-5-1-8s2-5 2-9c0-3-1-5-3-5Z" />
	{:else if kind === "shifter"}
		<path d="M4 22h12M28 22h12" />
		<circle cx="22" cy="22" r="5" />
	{:else}
		<path d="M10 36L30 10" />
		<circle cx="31" cy="9" r="4" />
		<path d="M6 36h16" />
	{/if}
</svg>
