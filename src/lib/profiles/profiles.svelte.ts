import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { load, type Store } from "@tauri-apps/plugin-store";
import { sanitizeSettings, type UserSettings } from "$lib/devices/settings";
import { wheel } from "$lib/devices/wheelbase.svelte";
import { type ProfileEntry, readProfileFile, writeProfileFile } from "./file";

export interface Profile {
	id: string;
	name: string;
	settings: UserSettings | null;
	updatedAt: number;
	useCount?: number;
	lastUsedAt?: number;
	games?: string[];
}

export const PROFILE_NAME_MAX = 32;
const TRAY_MAX_PROFILES = 5;
const SAVE_DEBOUNCE_MS = 500;

const newId = () => crypto.randomUUID();
const cleanName = (name: string) => name.trim().slice(0, PROFILE_NAME_MAX);

class Profiles {
	list = $state<Profile[]>([]);
	activeId = $state<string | null>(null);
	autoSwitch = $state(true);
	autoGame = $state<string | null>(null);
	ready = $state(false);

	#beforeGameId: string | null = null;
	#store: Store | null = null;
	#saveTimer: ReturnType<typeof setTimeout> | undefined;

	get active(): Profile | null {
		return this.list.find((p) => p.id === this.activeId) ?? null;
	}

	get activeName(): string {
		return this.active?.name ?? "Default";
	}

	#find = (id: string) => this.list.find((p) => p.id === id);

	async init() {
		if (this.ready) return;
		await this.#load();

		wheel.onUserChange = (settings) => {
			const active = this.active;
			if (!active) return;
			active.settings = settings;
			active.updatedAt = Date.now();
			this.#scheduleSave();
		};
		wheel.onConnect = () => this.#pushActive();
		if (wheel.connected) this.#pushActive();

		$effect.root(() => {
			$effect(() => this.#syncTray());
		});
		await listen<string>("tray-select-profile", async (e) => {
			await this.activate(e.payload);
			this.#syncTray();
		});

		await listen<string | null>("game-detected", (e) =>
			this.#onGame(e.payload),
		);
		$effect.root(() => {
			$effect(() => {
				const exes = this.autoSwitch
					? [...new Set(this.list.flatMap((p) => p.games ?? []))]
					: [];
				invoke("set_game_watch", { exes }).catch(() => {});
			});
		});

		this.ready = true;
	}

	async #load() {
		this.#store = await load("profiles.json", {
			autoSave: false,
			defaults: {},
		});
		this.list = ((await this.#store.get<Profile[]>("profiles")) ?? []).map(
			(p) => ({
				...p,
				name: cleanName(p.name) || "Profile",
			}),
		);
		this.activeId = (await this.#store.get<string>("activeId")) ?? null;
		this.autoSwitch = (await this.#store.get<boolean>("autoSwitch")) ?? true;

		if (this.list.length === 0) {
			const first: Profile = {
				id: newId(),
				name: "Default",
				settings: null,
				updatedAt: Date.now(),
			};
			this.list = [first];
			this.activeId = first.id;
			await this.#save();
		}
		if (!this.active) this.activeId = this.list[0].id;
	}

	#pushActive() {
		const active = this.active;
		if (!active) return;
		if (active.settings) {
			wheel.applySettings(active.settings);
		} else {
			active.settings = wheel.settings;
			this.#scheduleSave();
		}
	}

	async activate(id: string, source: "user" | "auto" = "user") {
		const profile = this.#find(id);
		if (!profile) return;
		if (source === "user") {
			this.autoGame = null;
			this.#beforeGameId = null;
		}
		if (id !== this.activeId) {
			profile.useCount = (profile.useCount ?? 0) + 1;
			profile.lastUsedAt = Date.now();
		}
		this.activeId = id;
		if (profile.settings) await wheel.applySettings(profile.settings);
		else profile.settings = wheel.settings;
		await this.#save();
	}

	async #onGame(exe: string | null) {
		if (!this.autoSwitch) return;
		if (exe) {
			const profile = this.list.find((p) => p.games?.includes(exe));
			if (!profile) return;
			if (this.autoGame === null) this.#beforeGameId = this.activeId;
			if (profile.id !== this.activeId) await this.activate(profile.id, "auto");
			this.autoGame = exe;
		} else if (this.autoGame) {
			const back = this.#beforeGameId;
			this.autoGame = null;
			this.#beforeGameId = null;
			if (back && back !== this.activeId && this.#find(back))
				await this.activate(back, "auto");
		}
	}

	async setAutoSwitch(on: boolean) {
		this.autoSwitch = on;
		if (!on) {
			this.autoGame = null;
			this.#beforeGameId = null;
		}
		await this.#save();
	}

	async linkGame(id: string, exe: string) {
		const profile = this.#find(id);
		const key = exe.trim().toLowerCase();
		if (!profile || !key) return;

		for (const p of this.list) p.games = p.games?.filter((g) => g !== key);
		profile.games = [...(profile.games ?? []), key];
		await this.#save();
	}

	async unlinkGame(id: string, exe: string) {
		const profile = this.#find(id);
		if (!profile) return;
		profile.games = profile.games?.filter((g) => g !== exe);
		await this.#save();
	}

	async create(name: string) {
		const profile: Profile = {
			id: newId(),
			name: cleanName(name) || "New profile",
			settings: wheel.settings,
			updatedAt: Date.now(),
		};
		this.list.push(profile);
		this.activeId = profile.id;
		await this.#save();
	}

	async duplicate(id: string) {
		const source = this.#find(id);
		if (!source) return;
		const copy: Profile = {
			id: newId(),
			name: cleanName(`${source.name} copy`),
			settings: source.settings ? { ...source.settings } : null,
			updatedAt: Date.now(),
		};
		this.list.splice(this.list.indexOf(source) + 1, 0, copy);
		await this.#save();
	}

	async rename(id: string, name: string) {
		const profile = this.#find(id);
		if (!profile || !cleanName(name)) return;
		profile.name = cleanName(name);
		profile.updatedAt = Date.now();
		await this.#save();
	}

	async remove(id: string) {
		if (this.list.length <= 1) return;
		this.list = this.list.filter((p) => p.id !== id);
		if (this.activeId === id) await this.activate(this.list[0].id);
		else await this.#save();
	}

	async exportProfiles(ids?: string[]): Promise<boolean> {
		const chosen = ids
			? this.list.filter((p) => ids.includes(p.id))
			: this.list;
		if (chosen.length === 0) return false;
		return writeProfileFile(
			chosen.map((p) => ({
				name: p.name,
				settings: $state.snapshot(p.settings),
				games: p.games?.length ? [...p.games] : undefined,
			})),
		);
	}

	async importProfiles(): Promise<number> {
		const entries = await readProfileFile();
		if (!entries) return 0;

		const base = wheel.settings;
		let added = 0;
		for (const raw of entries) {
			const entry = raw as Partial<ProfileEntry> | null;
			if (!entry || typeof entry.name !== "string") continue;
			this.list.push({
				id: newId(),
				name: this.#uniqueName(cleanName(entry.name) || "Imported"),
				settings: sanitizeSettings(entry.settings, base),
				games: Array.isArray(entry.games)
					? entry.games
							.filter((g): g is string => typeof g === "string")
							.map((g) => g.toLowerCase())
							.filter((g) => !this.list.some((p) => p.games?.includes(g)))
					: undefined,
				updatedAt: Date.now(),
			});
			added++;
		}
		if (added === 0) throw new Error("No profiles found in that file.");
		await this.#save();
		return added;
	}

	#uniqueName(name: string): string {
		const taken = new Set(this.list.map((p) => p.name.toLowerCase()));
		if (!taken.has(name.toLowerCase())) return name;
		for (let n = 2; ; n++) {
			const suffix = ` ${n}`;
			const candidate =
				name.slice(0, PROFILE_NAME_MAX - suffix.length) + suffix;
			if (!taken.has(candidate.toLowerCase())) return candidate;
		}
	}

	#trayProfiles(): Profile[] {
		const ranked = [...this.list].sort(
			(a, b) =>
				(b.useCount ?? 0) - (a.useCount ?? 0) ||
				(b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0),
		);
		const top = ranked.slice(0, TRAY_MAX_PROFILES);
		const active = this.active;
		if (active && !top.includes(active)) top[top.length - 1] = active;
		return top;
	}

	#syncTray() {
		const items = this.#trayProfiles().map((p) => ({ id: p.id, name: p.name }));
		invoke("set_tray_profiles", {
			profiles: items,
			activeId: this.activeId,
			hasMore: this.list.length > items.length,
		}).catch(() => {});
	}

	#scheduleSave() {
		clearTimeout(this.#saveTimer);
		this.#saveTimer = setTimeout(() => this.#save(), SAVE_DEBOUNCE_MS);
	}

	async #save() {
		if (!this.#store) return;
		await this.#store.set("profiles", $state.snapshot(this.list));
		await this.#store.set("activeId", this.activeId);
		await this.#store.set("autoSwitch", this.autoSwitch);
		await this.#store.save();
	}
}

export const profiles = new Profiles();
