<script lang="ts">
	import { selectedUnits } from '$lib/stores';
	import type { SelectedUnits } from '$lib/types';
	import { data } from '$lib/database';

	let info: any[] = [];

	const lookUpData = (su: SelectedUnits) => {
		if (su.units.length === 0) return;
		info = [];
		su.units.forEach((unit) => {
			let unitType = data.units.find((unitData) => unitData.id === unit.typeId);

			info.push(unitType);
		});
		info = info;
	};

	$: lookUpData($selectedUnits);
</script>

<div id="statusBoxes">
	<div id="resources">resources</div>
	{#if $selectedUnits.units.length > 0}
		<div id="selectedUnit">
			{#if $selectedUnits.units.length === 1}
				{info[0].name}
			{:else if $selectedUnits.units.length > 1}
				<br />
			{/if}
		</div>
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
