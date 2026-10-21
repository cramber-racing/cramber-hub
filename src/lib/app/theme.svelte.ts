import { load, type Store } from "@tauri-apps/plugin-store";

export type ThemeMode = "dark" | "light" | "system";

class Theme {
	mode = $state<ThemeMode>("dark");

	#store: Store | null = null;
	#media =
		typeof window !== "undefined"
			? window.matchMedia("(prefers-color-scheme: light)")
			: null;

	get resolved(): "dark" | "light" {
		if (this.mode === "system") return this.#media?.matches ? "light" : "dark";
		return this.mode;
	}

	async init() {
		this.#store = await load("settings.json", {
			autoSave: false,
			defaults: {},
		});
		this.mode = (await this.#store.get<ThemeMode>("theme")) ?? "dark";
		this.#apply();
		this.#media?.addEventListener("change", () => this.#apply());
	}

	async set(mode: ThemeMode) {
		this.mode = mode;
		this.#apply();
		await this.#store?.set("theme", mode);
		await this.#store?.save();
	}

	#apply() {
		document.documentElement.dataset.theme = this.resolved;
		try {
			localStorage.setItem("cramber-theme", this.mode);
		} catch {}
	}
}

export const theme = new Theme();
