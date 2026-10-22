<script lang="ts">
import { page } from "$app/state";
import { updater } from "$lib/app/updater.svelte";
import Logo from "./Logo.svelte";

const NAV = [
	{ href: "/", label: "Home" },
	{ href: "/wheel-base", label: "Wheel Base" },
	{ href: "/pedals", label: "Pedals" },
	{ href: "/shifter", label: "Shifter" },
	{ href: "/handbrake", label: "Handbrake" },
	{ href: "/profiles", label: "Profiles" },
];

const SETTINGS = { href: "/settings", label: "Settings" };

const isActive = (href: string) => (href === "/" ? page.url.pathname === "/" : page.url.pathname.startsWith(href));
</script>

{#snippet navItem(item: { href: string; label: string }, badge = "")}
	{@const active = isActive(item.href)}
	<a
		href={item.href}
		class="group flex items-center px-8 py-3 no-underline transition-all duration-300
			{active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}"
		aria-current={active ? "page" : undefined}
	>
		<span
			class="font-display text-sm tracking-widest uppercase transition-transform duration-300
				{active ? 'translate-x-2' : 'group-hover:translate-x-1'}"
		>
			{item.label}
		</span>

		{#if badge}
			<span class="ml-auto rounded-full bg-primary px-2 py-0.5 font-mono text-[8px] tracking-widest text-primary-foreground uppercase">
				{badge}
			</span>
		{:else if active}
			<span class="ml-auto size-1.5 rounded-full bg-primary"></span>
		{/if}
	</a>
{/snippet}

<aside class="flex w-64 shrink-0 flex-col border-r">
	<div class="flex h-24 items-center justify-center border-b px-5 text-foreground">
		<Logo size={32} class="mr-2" />
		<span class="font-display text-2xl font-bold tracking-widest uppercase">Cramber</span>
	</div>

	<nav class="flex flex-col gap-1 py-6">
		{#each NAV as item}
			{@render navItem(item)}
		{/each}
	</nav>

	<nav class="mt-auto border-t py-4">
		{@render navItem(SETTINGS, updater.available ? "Update" : "")}
	</nav>
</aside>
