<script lang="ts">
let { size = 28, class: klass = "" }: { size?: number; class?: string } = $props();
</script>

<div class="flex items-center gap-3 {klass}">
	<svg width={size} height={size} viewBox="0 0 200 200" fill="currentColor" aria-hidden="true">
		<path d="M0 83.1818L59.5721 186.364H139.682L179.572 117.273H99.9011L80.4812 83.6363H159.682L199.572 14.5454H39.6272L0 83.1818Z" />
	</svg>
</div>
