<script lang="ts">
	import { selectedUnits, units, game } from '$lib/stores';
	import { data } from '$lib/database';
	import { generateId } from '$lib/utils';
	import { Vector3 } from 'three';

	const addNewBuilding = (typeId: number) => {
		$selectedUnits.units = [];
		$units.push({
			id: generateId(),
			typeId,
			factionId: 0,
			targetId: '',
			selected: false,
			moveTo: new Vector3(2, 0.25, 2),
			currentPosition: new Vector3(2, 0.25, 2),
			state: 'idle',
			color: 'white',
			hold: false,
			health: 10,
			maxHealth: 10,
			distance: 0,
			visible: false,
			isBuilding: true,
			notYetPlaced: true
		});
		$units = $units;
		$game.placingBuilding = true;
	};
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
		<div id="selectedUnitOptions">
			{#if $selectedUnits.units[0].typeId === 101}
				<button on:click={() => addNewBuilding(102)}>Add new building</button>
			{/if}
		</div>
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
