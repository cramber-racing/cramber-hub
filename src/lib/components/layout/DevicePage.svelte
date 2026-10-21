<script lang="ts">
import type { Snippet } from "svelte";
import PageHeader from "./PageHeader.svelte";

let { title, hero, children }: { title: string; hero: Snippet; children: Snippet } = $props();
</script>

<PageHeader {title} />

<div class="mx-auto flex min-h-0 w-full max-w-400 flex-1 gap-8 p-6 lg:p-10">
	<div class="flex w-[45%] shrink-0 flex-col gap-8 overflow-y-auto *:shrink-0">
		{@render hero()}
	</div>

	<div class="flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-y-auto pr-2 *:shrink-0">
		{@render children()}
	</div>
</div>
