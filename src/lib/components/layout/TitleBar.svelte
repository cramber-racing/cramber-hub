<script lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { onDestroy, onMount } from "svelte";

const win = getCurrentWindow();

let maximized = $state(false);
let unlisten: (() => void) | undefined;

onMount(async () => {
	maximized = await win.isMaximized();
	unlisten = await win.onResized(async () => {
		maximized = await win.isMaximized();
	});
});
onDestroy(() => {
	unlisten?.();
	clearTimeout(snapTimer);
});

const SNAP_HOVER_MS = 500;
let snapTimer: ReturnType<typeof setTimeout> | undefined;
const startSnapHover = () => {
	clearTimeout(snapTimer);
	snapTimer = setTimeout(() => invoke("show_snap_layouts"), SNAP_HOVER_MS);
};
const cancelSnapHover = () => clearTimeout(snapTimer);
</script>

<header data-tauri-drag-region class="flex h-9 shrink-0 items-center justify-end border-b bg-background pl-4">
	<div class="flex h-full">
		<button class="grid h-full w-12 place-items-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" aria-label="Minimize" onclick={() => win.minimize()}>
			<svg width="10" height="10" viewBox="0 0 10 10">
                <path d="M0 5h10" stroke="currentColor" />
            </svg>
		</button>

		<button
			class="grid h-full w-12 place-items-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
			aria-label={maximized ? "Restore" : "Maximize"}
			onclick={() => {
				cancelSnapHover();
				win.toggleMaximize();
			}}
			onmouseenter={startSnapHover}
			onmouseleave={cancelSnapHover}
		>
			{#if maximized}
				<svg width="10" height="10" viewBox="0 0 10 10" fill="none">
					<rect x="0.5" y="2.5" width="7" height="7" stroke="currentColor" />
					<path d="M2.5 2.5V0.5h7v7h-2" stroke="currentColor" />
				</svg>
			{:else}
				<svg width="10" height="10" viewBox="0 0 10 10" fill="none">
					<rect x="0.5" y="0.5" width="9" height="9" stroke="currentColor" />
				</svg>
			{/if}
        </button>

		<button class="grid h-full w-12 place-items-center text-muted-foreground hover:bg-destructive/30 hover:text-destructive-foreground transition-colors" aria-label="Close" onclick={() => win.close()}>
			<svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 0l10 10M10 0L0 10" stroke="currentColor" /></svg>
		</button>
	</div>
</header>
