import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import type { UserSettings } from "$lib/devices/settings";

const FILE_FORMAT = "cramber-hub-profiles";
const FILE_VERSION = 2;
const FILE_FILTERS = [{ name: "Cramber profile", extensions: ["json"] }];

export interface ProfileEntry {
	name: string;
	settings: UserSettings | null;
	games?: string[];
}

interface ProfileFile {
	format: typeof FILE_FORMAT;
	version: number;
	exportedAt: string;
	profiles: ProfileEntry[];
}

const fileSafe = (name: string) =>
	name
		.replace(/[^\w\- ]+/g, "")
		.trim()
		.replace(/\s+/g, "-") || "profile";

export async function writeProfileFile(
	entries: ProfileEntry[],
): Promise<boolean> {
	const path = await save({
		defaultPath:
			entries.length === 1
				? `${fileSafe(entries[0].name)}.json`
				: "cramber-profiles.json",
		filters: FILE_FILTERS,
	});
	if (!path) return false;

	const file: ProfileFile = {
		format: FILE_FORMAT,
		version: FILE_VERSION,
		exportedAt: new Date().toISOString(),
		profiles: entries,
	};
	await invoke("write_profile_file", {
		path,
		contents: JSON.stringify(file, null, 2),
	});
	return true;
}

export async function readProfileFile(): Promise<unknown[] | null> {
	const path = await open({
		multiple: false,
		directory: false,
		filters: FILE_FILTERS,
	});
	if (!path || Array.isArray(path)) return null;

	const text = await invoke<string>("read_profile_file", { path });
	let data: unknown;
	try {
		data = JSON.parse(text);
	} catch {
		throw new Error("That file isn't valid JSON.");
	}
	const file = data as Partial<ProfileFile>;
	if (file?.format !== FILE_FORMAT || !Array.isArray(file.profiles)) {
		throw new Error("That file isn't a Cramber Hub profile.");
	}
	if ((file.version ?? 0) > FILE_VERSION) {
		throw new Error(
			"That profile was made by a newer Cramber Hub. Update the app to import it.",
		);
	}
	return file.profiles;
}

export async function pickExecutable(): Promise<string | null> {
	const path = await open({
		multiple: false,
		directory: false,
		filters: [{ name: "Game executable", extensions: ["exe"] }],
	});
	if (!path || Array.isArray(path)) return null;
	return path.split(/[\\/]/).pop()?.toLowerCase() ?? null;
}
