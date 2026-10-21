<script lang="ts">
import { tooltip } from "$lib/app/tooltip";

let {
	label,
	description = "",
	value,
	min = 0,
	max = 100,
	step = 1,
	unit = "",
	decimals = 0,
	disabled = false,
	oncommit,
	oninput,
}: {
	label: string;
	description?: string;
	value: number;
	min?: number;
	max?: number;
	step?: number;
	unit?: string;
	decimals?: number;
	disabled?: boolean;
	oncommit: (v: number) => void;
	oninput?: (v: number) => void;
} = $props();

const id = $props.id();

let local = $state(0);
let dragging = $state(false);
$effect(() => {
	if (!dragging) local = value;
});

const percent = $derived(
	Math.min(Math.max(((local - min) / (max - min)) * 100, 0), 100),
);

let editing = $state(false);
let draft = $state("");

function startEdit() {
	draft = local.toFixed(decimals);
	editing = true;
}

function commitEdit() {
	if (!editing) return;
	editing = false;
	const typed = Number(draft.replace(",", "."));
	if (!Number.isFinite(typed)) return;

	const snapped =
		min + Math.round((Math.min(Math.max(typed, min), max) - min) / step) * step;
	const v = Number(snapped.toFixed(6));
	if (v === local) return;
	local = v;
	oninput?.(v);
	oncommit(v);
}

const selectAll = (node: HTMLInputElement) => {
	node.focus();
	node.select();
};
</script>

<div class="transition-opacity {disabled ? 'pointer-events-none opacity-40' : ''}">
	<div class="mb-1 flex items-end justify-between gap-4">
		<div>
			<label for={id} class="mb-0.5 block text-xs font-bold tracking-widest uppercase">{label}</label>
			{#if description}
				<span class="font-mono text-[10px] text-muted-foreground">{description}</span>
			{/if}
		</div>

		<div class="flex items-baseline font-display text-xl font-bold tracking-tighter tabular-nums">
			{#if editing}
				<input
					use:selectAll
					bind:value={draft}
					inputmode="decimal"
					aria-label="{label} value"
					onblur={commitEdit}
					onkeydown={(e) => {
						if (e.key === "Enter") commitEdit();
						if (e.key === "Escape") editing = false;
					}}
					class="value-box value-input bg-muted"
				/>
			{:else}
				<button
					type="button"
					use:tooltip={"Click to type a value"}
					onclick={startEdit}
					class="value-box cursor-text hover:bg-muted"
				>
					{local.toFixed(decimals)}
				</button>
			{/if}
			{#if unit}<span class="ml-1 text-xs text-muted-foreground">{unit}</span>{/if}
		</div>
	</div>

	<div class="group relative flex h-8 items-center">
		<div class="absolute h-px w-full bg-border"></div>
		<div class="absolute h-px bg-foreground" style="width: {percent}%"></div>

		<input
			{id}
			type="range"
			{min}
			{max}
			{step}
			{disabled}
			bind:value={local}
			onpointerdown={() => (dragging = true)}
			onpointerup={() => {
				setTimeout(() => (dragging = false));
			}}
			oninput={(e) => oninput?.(Number(e.currentTarget.value))}
			onchange={() => {
				dragging = false;
				oncommit(local);
			}}
			class="absolute h-full w-full cursor-pointer opacity-0"
		/>

		<div
			class="pointer-events-none absolute size-3 rounded-full bg-foreground transition-transform group-hover:scale-150"
			style="left: calc({percent}% - 6px)"
		></div>
	</div>
</div>

<style>
.value-box {
	min-width: 2ch;
	padding: 0 0.3em;
	margin-right: -0.3em;
	border: none;
	border-radius: 0.375rem;
	font: inherit;
	letter-spacing: inherit;
	color: inherit;
	text-align: right;
	outline: none;
	transition: background-color 150ms;
}
.value-input {
	field-sizing: content;
	caret-color: var(--color-primary);
}
.value-input::selection {
	background: color-mix(in srgb, var(--color-primary) 35%, transparent);
}
.value-box:focus-visible {
	box-shadow: 0 0 0 1px var(--color-primary);
}
</style>
