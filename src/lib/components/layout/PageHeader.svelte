<script lang="ts">
import { devices } from "$lib/devices/registry.svelte";
import ProfileSwitcher from "./ProfileSwitcher.svelte";

let { title }: { title: string } = $props();
</script>

<header class="relative z-20 flex shrink-0 items-end justify-between gap-8 border-b px-16 pt-10 py-8">
	<div class="flex flex-col">
		<h1 class="text-3xl uppercase font-display font-bold tracking-tighter">
			{title}
		</h1>

		<div class="flex items-center gap-4 mt-2 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
			<span class="size-1 bg-primary rounded-full"></span>
			<span>{devices.connected} device{devices.connected === 1 ? "" : "s"} active</span>
		</div>
	</div>

	<ProfileSwitcher />
</header>
