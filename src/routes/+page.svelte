<script lang="ts">
import { tooltip } from "$lib/app/tooltip";
import DeviceCard from "$lib/components/devices/DeviceCard.svelte";
import DeviceIcon from "$lib/components/devices/DeviceIcon.svelte";
import PageHeader from "$lib/components/layout/PageHeader.svelte";
import { DEVICE_LIST, type DeviceKind, devices } from "$lib/devices/registry.svelte";
import { wheel } from "$lib/devices/wheelbase.svelte";
import { profiles } from "$lib/profiles/profiles.svelte";

const online = $derived(devices.connected > 0);
const profile = $derived(profiles.activeName);
const pad = (n: number) => String(n).padStart(2, "0");

function details(kind: DeviceKind): { version: string | null; stats: { label: string; value: string }[] } {
	if (kind === "wheel") {
		return {
			version: wheel.firmware !== null ? `V${wheel.firmware}` : null,
			stats: [
				{ label: "Range", value: `${wheel.values.steeringRangeDeg.toFixed(0)}°` },
				{ label: "FFB", value: wheel.ffbActive ? "On" : "Off" },
			],
		};
	}
	return { version: null, stats: [] };
}
</script>

<PageHeader title="Dashboard" />
<div class="min-h-0 flex-1 overflow-y-auto">
	<div class="py-14 p-6 lg:p-10 w-full max-w-400 mx-auto">
		<section class="relative">
			<span class="absolute top-0 left-0 w-full overflow-hidden pointer-events-none opacity-10 select-none text-massive uppercase font-display font-black whitespace-nowrap">Cramber</span>

			<div class="relative z-10">
				<h2 class="text-4xl md:text-6xl font-display font-bold leading-none tracking-tighter mb-6 uppercase">
					System<br />
					<span class={online ? "text-primary" : ""}>{online ? "Online." : "Offline."}</span>
				</h2>

				<div class="flex items-center gap-8">
					<div class="flex flex-col">
						<span class="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-1">
							Active profile
						</span>
						<span class="block max-w-xl truncate text-lg font-bold tracking-widest uppercase" use:tooltip={{ text: profile, overflowOnly: true }}>
							{profile}
						</span>
					</div>

					<div class="flex flex-col">
						<span class="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-1">
							Connected
						</span>
						<span class="text-lg font-bold tracking-widest uppercase">
							{pad(devices.connected)} / {pad(devices.total)}
						</span>
					</div>
				</div>
			</div>
		</section>

		<section class="mt-16 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4 gap-6">
			{#each DEVICE_LIST as device, i (device.kind)}
				{@const info = details(device.kind)}
				<DeviceCard
					index={i + 1}
					name={device.name}
					version={info.version}
					connected={devices.isConnected(device.kind)}
					href={device.href}
					stats={info.stats}
				>
					{#snippet icon()}<DeviceIcon kind={device.kind} />{/snippet}
				</DeviceCard>
			{/each}
		</section>
	</div>
</div>
