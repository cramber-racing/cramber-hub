import { getVersion } from "@tauri-apps/api/app";
import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";

const FIRST_CHECK_MS = 10_000;
const CHECK_EVERY_MS = 6 * 60 * 60 * 1000;

class AppUpdater {
	currentVersion = $state<string | null>(null);
	available = $state<{ version: string; notes: string } | null>(null);
	checking = $state(false);
	installing = $state(false);
	progress = $state<number | null>(null);
	error = $state<string | null>(null);
	lastChecked = $state<Date | null>(null);

	#update: Update | null = null;
	#timer: ReturnType<typeof setTimeout> | undefined;

	async start() {
		this.currentVersion = await getVersion().catch(() => null);
		this.#timer = setTimeout(this.#scheduled, FIRST_CHECK_MS);
	}

	stop() {
		clearTimeout(this.#timer);
	}

	#scheduled = async () => {
		await this.check(true);
		this.#timer = setTimeout(this.#scheduled, CHECK_EVERY_MS);
	};

	/** `quiet`: background check, don't report "couldn't check" errors. */
	async check(quiet = false) {
		if (this.checking || this.installing) return;
		this.checking = true;
		if (!quiet) this.error = null;
		try {
			this.#update = await check();
			this.available = this.#update
				? { version: this.#update.version, notes: this.#update.body ?? "" }
				: null;
			this.lastChecked = new Date();
		} catch (e) {
			if (!quiet)
				this.error = `Couldn't check for updates: ${e instanceof Error ? e.message : String(e)}`;
		} finally {
			this.checking = false;
		}
	}

	/** Downloads and installs the update, then restarts the app. */
	async install() {
		if (!this.#update || this.installing) return;
		this.installing = true;
		this.error = null;
		this.progress = 0;
		let total = 0;
		let received = 0;
		try {
			await this.#update.downloadAndInstall((event) => {
				if (event.event === "Started") total = event.data.contentLength ?? 0;
				else if (event.event === "Progress") {
					received += event.data.chunkLength;
					this.progress = total > 0 ? received / total : null;
				}
			});
			await relaunch();
		} catch (e) {
			this.error = `The update failed: ${e instanceof Error ? e.message : String(e)}`;
			this.installing = false;
		}
	}
}

export const updater = new AppUpdater();
