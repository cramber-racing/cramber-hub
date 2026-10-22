<script lang="ts">
import DeviceHero from "$lib/components/devices/DeviceHero.svelte";
import DevicePage from "$lib/components/layout/DevicePage.svelte";
import Button from "$lib/components/ui/Button.svelte";
import Card from "$lib/components/ui/Card.svelte";
import Notice from "$lib/components/ui/Notice.svelte";
import FirmwareDialog from "$lib/components/wheel/FirmwareDialog.svelte";
import InteractiveWheel from "$lib/components/wheel/InteractiveWheel.svelte";
import ResetButton from "$lib/components/wheel/ResetButton.svelte";
import SettingSlider from "$lib/components/wheel/SettingSlider.svelte";
import SettingToggle from "$lib/components/wheel/SettingToggle.svelte";
import { AxisState } from "$lib/devices/protocol";
import { type NumberKey, type ProfileKey, SETTINGS, type ToggleKey } from "$lib/devices/settings";
import { firmware } from "$lib/devices/firmware.svelte";
import { wheel } from "$lib/devices/wheelbase.svelte";

interface Section {
	title: string;
	toggle?: ToggleKey;
	sliders: NumberKey[];
}

const SECTIONS: Section[] = [
	{ title: "Force Feedback", sliders: ["ffbGain", "ffbDetail", "steeringRangeDeg"] },
	{ title: "Effects", sliders: ["naturalDamping", "naturalFriction", "naturalInertia"] },
	{ title: "Idle Spring", toggle: "idleSpringEnabled", sliders: ["idleSpringStiffness", "idleSpringDamping"] },
	{
		title: "End Stops",
		toggle: "bumpstopEnabled",
		sliders: ["bumpstopStiffness", "bumpstopDamping", "bumpstopRangeDeg"],
	},
];

const resetKeys = (s: Section) =>
	[...(s.toggle ? [s.toggle] : []), ...s.sliders].filter((k) => SETTINGS[k].profile) as ProfileKey[];

const STATE_LABEL: Record<AxisState, string> = {
	[AxisState.Idle]: "Ready",
	[AxisState.CalibratingEncoder]: "Calibrating",
	[AxisState.Homing]: "Centering",
	[AxisState.CalibratingAnticogging]: "Calibrating",
	[AxisState.Running]: "Active",
	[AxisState.Error]: "Error",
};

const status = $derived(
	!wheel.connected
		? "Offline"
		: wheel.driverFault
			? "Fault"
			: wheel.axisState !== null
				? STATE_LABEL[wheel.axisState]
				: "Online",
);
const dot = $derived(
	!wheel.connected
		? "bg-hero-foreground/25"
		: wheel.driverFault
			? "bg-destructive"
			: wheel.ffbActive
				? "bg-primary"
				: "bg-hero-foreground/60",
);
const range = $derived(wheel.values.steeringRangeDeg);
</script>

<DevicePage title="Wheel Base">
	{#snippet hero()}
		<DeviceHero
			name="Cramber DD{wheel.firmware !== null ? ` · V${wheel.firmware}` : ''}{wheel.connected && wheel.serial ? ` · SN ${wheel.serial}` : ''}"
			watermark="DD"
			tone="hero"
		>
			{#snippet badges()}
				<div class="flex items-center gap-2">
					{#if wheel.gameFfb}
						<span class="rounded-full bg-primary px-2 py-0.5 font-mono text-[9px] tracking-widest text-primary-foreground uppercase">
							In game
						</span>
					{/if}
					<span class="flex items-center gap-2 rounded-full border border-hero-foreground/15 px-3 py-1 font-mono text-[9px] tracking-widest uppercase">
						<span class="size-1.5 rounded-full {dot}"></span>{status}
					</span>
				</div>
			{/snippet}

			<div
				class="relative flex flex-1 flex-col items-center justify-center transition-[filter,opacity] duration-500
					{wheel.connected ? '' : 'opacity-50 grayscale'}"
			>
				<InteractiveWheel angle={wheel.wheelAngle} {range} />
			</div>

			<h2 class="mb-5 font-display text-4xl leading-none font-bold tracking-tighter uppercase">
				Direct<br />Drive
			</h2>

			<div class="flex items-center gap-4">
				{#each [["Status", status], ["Range", `${range.toFixed(0)}°`], ["FFB", wheel.ffbActive ? "On" : "Off"]] as [label, value], i}
					{#if i > 0}<div class="h-8 w-px bg-hero-foreground/15"></div>{/if}
					<div class="flex flex-col">
						<span class="mb-1 font-mono text-[9px] tracking-widest text-hero-foreground/50 uppercase">{label}</span>
						<span class="text-sm font-bold tracking-widest uppercase">{value}</span>
					</div>
				{/each}
			</div>
		</DeviceHero>
	{/snippet}

	{#if !wheel.connected && firmware.inBootloader}
		<Notice title="Base in update mode" tone="danger">
			The last firmware update didn't finish. Install the firmware again to get the base running.
			{#snippet action()}
				<Button variant="danger" onclick={() => firmware.choose()}>Install firmware…</Button>
			{/snippet}
		</Notice>
	{:else if !wheel.connected}
		<Notice title="Base not connected">
			Plug in the Cramber DD over USB. Settings unlock as soon as it's found.
		</Notice>
	{:else if wheel.driverFault}
		<Notice title="Motor driver fault" tone="danger">
			Force feedback stopped to protect the hardware. If it comes back, power-cycle the base.
			{#snippet action()}
				<Button variant="danger" onclick={() => wheel.clearFaults()}>Clear fault</Button>
			{/snippet}
		</Notice>
	{/if}

	{#if wheel.error}
		<div class="rounded-3xl border border-destructive/40 p-5 font-mono text-[11px] text-destructive">{wheel.error}</div>
	{/if}

	<div
		class="flex flex-col gap-6 transition-opacity {wheel.connected ? '' : 'pointer-events-none opacity-30'}"
		aria-disabled={!wheel.connected}
	>
		<p class="px-2 font-mono text-[10px] tracking-wider text-muted-foreground">
			Changes apply instantly and last until the base is powered off.
		</p>

		{#each SECTIONS as section (section.title)}
			{@const off = section.toggle !== undefined && !wheel.values[section.toggle]}
			<Card title={section.title}>
				{#snippet action()}<ResetButton keys={resetKeys(section)} />{/snippet}
				<div class="space-y-6">
					{#if section.toggle}<SettingToggle key={section.toggle} />{/if}
					{#each section.sliders as key (key)}
						<SettingSlider {key} disabled={off} />
					{/each}
				</div>
			</Card>
		{/each}

		<Card title="System">
			<div class="space-y-6">
				<SettingToggle key="startupSoundEnabled" />
				<div class="flex flex-wrap gap-3">
					<Button disabled={!wheel.connected} onclick={() => wheel.playSound()}>Play sound</Button>
				</div>

				<div class="flex items-center justify-between gap-4 border-t pt-6">
					<span>
						<span class="mb-0.5 block text-xs font-bold tracking-widest uppercase">Firmware</span>
						<span class="font-mono text-[10px] text-muted-foreground">
							{wheel.firmware !== null ? `Version ${wheel.firmware}` : "Unknown version"}. Install a firmware file
							(.bin) to update the base.
						</span>
						{#if firmware.fileError}
							<span class="mt-1 block font-mono text-[10px] text-destructive">{firmware.fileError}</span>
						{/if}
					</span>
					<Button disabled={!wheel.connected} onclick={() => firmware.choose()}>Update firmware…</Button>
				</div>
			</div>
		</Card>
	</div>
</DevicePage>

<FirmwareDialog />
