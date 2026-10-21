export interface KnownGame {
	name: string;
	exe: string;
}

export const KNOWN_GAMES: KnownGame[] = [
	{ name: "Assetto Corsa", exe: "acs.exe" },
	{ name: "Assetto Corsa Competizione", exe: "ac2-win64-shipping.exe" },
	{ name: "Assetto Corsa EVO", exe: "assettocorsaevo.exe" },
	{ name: "iRacing", exe: "iracingsim64dx11.exe" },
	{ name: "Le Mans Ultimate", exe: "le mans ultimate.exe" },
	{ name: "rFactor 2", exe: "rfactor2.exe" },
	{ name: "Automobilista 2", exe: "ams2avx.exe" },
	{ name: "RaceRoom", exe: "rrre64.exe" },
	{ name: "BeamNG.drive", exe: "beamng.drive.x64.exe" },
	{ name: "F1 24", exe: "f1_24.exe" },
	{ name: "F1 25", exe: "f1_25.exe" },
	{ name: "EA SPORTS WRC", exe: "wrc.exe" },
	{ name: "DiRT Rally 2.0", exe: "dirtrally2.exe" },
	{ name: "Richard Burns Rally", exe: "richardburnsrally_sse.exe" },
	{ name: "Forza Horizon 5", exe: "forzahorizon5.exe" },
	{ name: "Euro Truck Simulator 2", exe: "eurotrucks2.exe" },
	{ name: "American Truck Simulator", exe: "amtrucks.exe" },
];

export function gameName(exe: string): string {
	return KNOWN_GAMES.find((g) => g.exe === exe.toLowerCase())?.name ?? exe;
}
