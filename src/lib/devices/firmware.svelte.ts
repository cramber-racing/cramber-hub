import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import {
	bootloaderPresent,
	type FirmwareInfo,
	inspectFirmware,
	type UpdateProgress,
	type UpdateStage,
	updateFirmware,
} from "./protocol";
import { wheel } from "./wheelbase.svelte";

const BOOTLOADER_CHECK_MS = 2000;

export const STAGE_LABEL: Record<UpdateStage, string> = {
	restarting: "Restarting the base into update mode",
	erasing: "Erasing the old firmware",
	writing: "Writing the new firmware",
	verifying: "Verifying",
	starting: "Starting the new firmware",
};

type State =
	| { step: "idle" }
	| { step: "confirm"; path: string; file: FirmwareInfo }
	| {
			step: "running";
			file: FirmwareInfo;
			stage: UpdateStage;
			progress: number;
	  }
	| { step: "done"; file: FirmwareInfo }
	| { step: "failed"; path: string; file: FirmwareInfo; error: string };

class FirmwareUpdate {
	state = $state<State>({ step: "idle" });
	inBootloader = $state(false);
	fileError = $state<string | null>(null);

	#timer: ReturnType<typeof setTimeout> | undefined;

	get busy(): boolean {
		return this.state.step === "running";
	}

	start() {
		void listen<UpdateProgress>("firmware-update", (e) => {
			if (this.state.step === "running")
				this.state = {
					...this.state,
					stage: e.payload.stage,
					progress: e.payload.progress,
				};
		});
		this.#watch();
	}

	async choose() {
		this.fileError = null;
		const path = await open({
			multiple: false,
			directory: false,
			filters: [{ name: "Cramber DD firmware", extensions: ["bin"] }],
		});
		if (!path || Array.isArray(path)) return;
		try {
			this.state = { step: "confirm", path, file: await inspectFirmware(path) };
		} catch (e) {
			this.fileError = e instanceof Error ? e.message : String(e);
		}
	}

	async install() {
		const s = this.state;
		if (s.step !== "confirm" && s.step !== "failed") return;
		const { path, file } = s;

		this.state = { step: "running", file, stage: "restarting", progress: 0 };
		wheel.suspended = true;
		try {
			await updateFirmware(path);
			this.state = { step: "done", file };
		} catch (e) {
			this.state = {
				step: "failed",
				path,
				file,
				error: e instanceof Error ? e.message : String(e),
			};
		} finally {
			wheel.suspended = false;
			this.inBootloader = await bootloaderPresent().catch(() => false);
		}
	}

	close() {
		if (!this.busy) this.state = { step: "idle" };
	}

	#watch = async () => {
		if (!wheel.connected && !this.busy)
			this.inBootloader = await bootloaderPresent().catch(() => false);
		else if (wheel.connected) this.inBootloader = false;
		this.#timer = setTimeout(this.#watch, BOOTLOADER_CHECK_MS);
	};

	stop() {
		clearTimeout(this.#timer);
	}
}

export const firmware = new FirmwareUpdate();
