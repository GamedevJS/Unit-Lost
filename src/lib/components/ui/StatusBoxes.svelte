<script lang="ts">
	import { selectedUnits, units } from '$lib/stores';
	import { data } from '$lib/database';
</script>

<div id="statusBoxes">
	<div id="resources">resources</div>
	{#if $selectedUnits.units.length > 0}
		<div id="selectedUnit">
			{#each $units as unit}
				{#if unit.selected}
					Unit: {data.units[unit.typeId.toString()].name}<br />
					Health: {Math.ceil(unit.health)} / {unit.maxHealth}<br />
				{/if}
			{/each}
		</div>
	{/if}
	{#if $selectedUnits.units.length === 1}
		<div id="selectedUnitOptions">selected unit options</div>
	{/if}
</div>

<style>
	#statusBoxes {
		position: absolute;
		bottom: 20px;
		left: 20px;
		display: flex;
		flex-direction: row;
	}

	#statusBoxes > div {
		height: 180px;
		margin-right: 20px;
		padding: 20px;
		background-color: #0a0a0a;
		border: 1px solid #1b1b1b;
		color: white;
	}
</style>
