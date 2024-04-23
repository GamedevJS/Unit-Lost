<script lang="ts">
	import { selectedUnits, units, game, gameTime } from '$lib/stores';
	import { data } from '$lib/database';
	import { generateId, isPointInSquareRadius } from '$lib/utils';
	import { Vector3 } from 'three';

	let date = new Date();

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

	const addNewUnit = (typeId: number) => {
		if ($game.unitCount >= $game.supply) {
			return;
		}
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
			isBuilding: false
		});
		$units = $units;
		$game.unitCount++;
	};

	const deleteBuilding = (id: string) => {
		let buildingToDeleteIndex = $units.findIndex((u) => u.id === id);
		$units[buildingToDeleteIndex].health = 0;
		$units = $units;
	};

	$: {
		date.setTime($gameTime);
		date = date;
	}
</script>

<div id="statusBoxes">
	<div id="resources">
		Time: {date.getMinutes()}:{(date.getSeconds() < 10 ? '0' : '') + date.getSeconds()}<br />
		Credits: {$game.credits}<br />
		Supply: {$game.unitCount}/{$game.supply}<br />
	</div>
	{#if $selectedUnits.units.length > 0}
		<div id="selectedUnit">
			{#each $units as unit}
				{#if unit.selected}
					Unit: {data.units[unit.typeId.toString()].name}<br />
					Health: {Math.ceil(unit.health)} / {unit.maxHealth}<br />
					{#if unit.isBuilding}
						Power: {unit.hasPower || unit.typeId === 102 ? 'on' : 'off'}<br />
					{/if}
				{/if}
			{/each}
		</div>
	{/if}
	{#if $selectedUnits.units.length === 1 && $selectedUnits.units[0].isBuilding}
		<div id="selectedUnitOptions">
			{#if $selectedUnits.units[0].typeId === 101}
				<button on:click={() => addNewBuilding(102)}>Add power station</button><br />
				<button on:click={() => addNewBuilding(103)} disabled={!$selectedUnits.units[0].hasPower}
					>Add supply depot</button
				><br />
				<button
					on:click={() => addNewUnit(1)}
					disabled={$game.unitCount >= $game.supply || !$selectedUnits.units[0].hasPower}
					>Build Robot</button
				>
			{:else}
				<button on:click={() => deleteBuilding($selectedUnits.units[0].id)}>Remove building</button>
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
