import type { Action } from "svelte/action";

export type TooltipOptions =
	| string
	| null
	| undefined
	| { text: string | null | undefined; overflowOnly?: boolean };

const SHOW_DELAY_MS = 250;
const GAP = 8;
const EDGE = 8;

let bubble: HTMLDivElement | null = null;
let owner: HTMLElement | null = null;

function getBubble(): HTMLDivElement {
	if (!bubble) {
		bubble = document.createElement("div");
		bubble.setAttribute("role", "tooltip");
		bubble.className =
			"pointer-events-none fixed z-[1000] max-w-xs rounded-lg border bg-card px-3 py-1.5 font-mono text-[10px] leading-relaxed tracking-wide text-card-foreground shadow-xl shadow-black/30 opacity-0 transition-opacity duration-100";
		document.body.appendChild(bubble);
	}
	return bubble;
}

function place(node: HTMLElement, text: string) {
	const b = getBubble();
	b.textContent = text;
	b.style.left = "0px";
	b.style.top = "0px";

	const r = node.getBoundingClientRect();
	const tip = b.getBoundingClientRect();
	let top = r.top - tip.height - GAP;
	if (top < EDGE) top = r.bottom + GAP;
	const left = Math.min(
		Math.max(r.left + r.width / 2 - tip.width / 2, EDGE),
		window.innerWidth - tip.width - EDGE,
	);

	b.style.left = `${left}px`;
	b.style.top = `${top}px`;
	b.style.opacity = "1";
	owner = node;
}

function hideFor(node: HTMLElement) {
	if (owner !== node || !bubble) return;
	bubble.style.opacity = "0";
	owner = null;
}

const normalize = (o: TooltipOptions) =>
	typeof o === "object" && o !== null
		? { text: o.text ?? "", overflowOnly: !!o.overflowOnly }
		: { text: o ?? "", overflowOnly: false };

export const tooltip: Action<HTMLElement, TooltipOptions> = (node, options) => {
	let opts = normalize(options);
	let timer: ReturnType<typeof setTimeout> | undefined;

	const wanted = () =>
		!!opts.text && (!opts.overflowOnly || node.scrollWidth > node.clientWidth);

	const show = () => {
		clearTimeout(timer);
		if (!wanted()) return;
		timer = setTimeout(() => place(node, opts.text), SHOW_DELAY_MS);
	};
	const hide = () => {
		clearTimeout(timer);
		hideFor(node);
	};
	const onFocus = () => {
		if (node.matches(":focus-visible")) show();
	};

	node.addEventListener("mouseenter", show);
	node.addEventListener("mouseleave", hide);
	node.addEventListener("pointerdown", hide);
	node.addEventListener("focusin", onFocus);
	node.addEventListener("focusout", hide);

	return {
		update(next) {
			opts = normalize(next);
			if (owner === node) {
				if (wanted()) place(node, opts.text);
				else hide();
			}
		},
		destroy() {
			hide();
			node.removeEventListener("mouseenter", show);
			node.removeEventListener("mouseleave", hide);
			node.removeEventListener("pointerdown", hide);
			node.removeEventListener("focusin", onFocus);
			node.removeEventListener("focusout", hide);
		},
	};
};
