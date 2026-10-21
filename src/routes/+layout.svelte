<script lang="ts">
import "$src/styles/index.css";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { onDestroy, onMount } from "svelte";
import { goto } from "$app/navigation";
import { theme } from "$lib/app/theme.svelte";
import Sidebar from "$lib/components/layout/Sidebar.svelte";
import TitleBar from "$lib/components/layout/TitleBar.svelte";
import { wheel } from "$lib/devices/wheelbase.svelte";
import { profiles } from "$lib/profiles/profiles.svelte";

let { children } = $props();

onMount(async () => {
	await theme.init();
	requestAnimationFrame(() =>
		requestAnimationFrame(() => invoke("show_window_on_startup")),
	);
	await profiles.init();
	await listen<string>("navigate", (e) => goto(e.payload));
	wheel.start();
});
onDestroy(() => wheel.stop());
</script>

<div class="flex h-screen bg-background">
    <Sidebar />
    <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
        <TitleBar />

        <main class="flex min-h-0 flex-1 flex-col overflow-hidden">
            {@render children()}
        </main>
    </div>
</div>
