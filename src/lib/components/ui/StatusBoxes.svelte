<script lang="ts">
	import { selectedUnits, units, game, gameTime, message } from '$lib/stores';
	import { data } from '$lib/database';
	import { generateId, isPointInSquareRadius } from '$lib/utils';
	import { Vector3, Quaternion, Euler } from 'three';

	let date = new Date();
	let showMessage = false;
	let timeout = 0;

	const messageChanged = (m: string) => {
		if (!m) return;
		showMessage = true;
		clearTimeout(timeout);
		timeout = setTimeout(() => {
			showMessage = false;
		}, 3000);
	};

	$: messageChanged($message);

	const addNewBuilding = (typeId: number) => {
		$selectedUnits.units = [];
		if ($game.credits < data.units[typeId].cost) {
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
			quaternion: new Quaternion(),
			euler: new Euler(),
			state: 'idle',
			color: 'white',
			hold: false,
			attackMove: false,
			health: data.units[typeId].health,
			maxHealth: data.units[typeId].health,
			distance: 0,
			visible: false,
			isBuilding: true,
			notYetPlaced: true
		});
		$units = $units;
		$game.placingBuilding = true;
		$game.credits -= data.units[typeId].cost;
	};

	const addNewUnit = (typeId: number) => {
		if ($game.unitCount >= $game.supply) {
			return;
		}
		if ($game.credits < data.units[typeId].cost) {
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
			quaternion: new Quaternion(),
			euler: new Euler(),
			rotateDestination: new Quaternion(),
			state: 'idle',
			color: '#ff7624',
			hold: false,
			attackMove: false,
			health: 10,
			maxHealth: 10,
			distance: 0,
			visible: false,
			isBuilding: false
		});
		$units = $units;
		$game.unitCount++;
		$game.credits -= data.units[typeId].cost;
	};

	const deleteBuilding = (id: string) => {
		let buildingToDeleteIndex = $units.findIndex((u) => u.id === id);
		$units[buildingToDeleteIndex].health = 0;
		$game.credits += data.units[$units[buildingToDeleteIndex].typeId].cost;
		$units = $units;
		$selectedUnits.units = [];
	};

	$: {
		date.setTime($gameTime);
		date = date;
	}
</script>

{#if $game.showWelcomeMessage}
	<div class="welcomeMessage">
		<h3>Welcome to Unit Lost!</h3>
		<p>Defend your base from waves of enemy robots!</p>
		<p class="withImage" style="background-image:url('intro1.png')">
			Left mouse to select objects. Right mouse to move/attack.
		</p>
		<p class="withImage" style="background-image:url('intro4.png')">
			There is a new wave every minute.
		</p>
		<p class="withImage" style="background-image:url('intro2.png')">
			Robots flash red when attacking.
		</p>
		<p class="withImage" style="background-image:url('intro3.png')">
			Collect credits from around the map.
		</p>
		<p>It's game over when your citidel is destroyed.</p>
		<button on:click={() => ($game.showWelcomeMessage = false)}>Dismiss</button>
	</div>
{/if}

{#if showMessage}
	<div class="message">
		<p>{$message}</p>
	</div>
{/if}

{#if $game.gameOver}
	<div id="gameOver" class="message">
		<h2>Game Over</h2>
		<p>Your citidel was destroyed!</p>
	</div>
{/if}

<div id="statusBoxes">
	<div id="resources">
		<small>Time:</small>
		<div>{date.getMinutes()}:{(date.getSeconds() < 10 ? '0' : '') + date.getSeconds()}</div>
		<small>Credits:</small>
		<div>{$game.credits}</div>
		<small>Supply:</small>
		<div>{$game.unitCount}/{$game.supply}</div>
	</div>
	{#if $selectedUnits.units.length > 0}
		<div id="selectedUnit">
			{#if $selectedUnits.units.length > 1}
				<div id="unitsGroup">
					{#each $units as unit}
						{#if unit.selected}
							<div></div>
						{/if}
					{/each}
				</div>
			{:else}
				{#each $units as unit}
					{#if unit.selected}
						<h3>{data.units[unit.typeId.toString()].name}</h3>
						<small>Health: </small>
						<div class="info">{Math.ceil(unit.health)} / {unit.maxHealth}</div>
						{#if unit.isBuilding}
							<small>Power: </small>
							<div>{unit.hasPower || unit.typeId === 102 ? 'online' : 'offline'}</div>
						{/if}
					{/if}
				{/each}
			{/if}
		</div>
	{/if}
	{#if $selectedUnits.units.length === 1 && $selectedUnits.units[0].isBuilding}
		<div id="selectedUnitOptions">
			{#if $selectedUnits.units[0].typeId === 101}
				<button on:click={() => addNewBuilding(102)} disabled={$game.credits < data.units[102].cost}
					>Build power station</button
				>
				<small>cost: 20 credits</small>
				<button
					on:click={() => addNewBuilding(103)}
					disabled={!$selectedUnits.units[0].hasPower || $game.credits < data.units[103].cost}
					>Build supply depot</button
				>
				<small>cost: 40 credits</small>
				<button
					on:click={() => addNewUnit(1)}
					disabled={$game.unitCount >= $game.supply || !$selectedUnits.units[0].hasPower}
					>Build Robot</button
				>
				<small>cost: 1 supply</small>
			{:else}
				<button on:click={() => deleteBuilding($selectedUnits.units[0].id)}>Remove building</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	button {
		display: block;
		background-color: #303030;
		inline-size: 100%;
		color: white;
		padding: 10px;
		border: 0;
		border-radius: 5px;
		cursor: pointer;
	}

	button:disabled {
		background-color: #161616;
		color: rgb(82, 82, 82);
	}

	h3 {
		margin-top: 0px;
	}

	#statusBoxes {
		position: absolute;
		bottom: 20px;
		left: 20px;
		display: flex;
		flex-direction: row;
	}

	#statusBoxes > div {
		min-width: 100px;
		height: 180px;
		margin-right: 20px;
		padding: 20px;
		background-color: #0a0a0a;
		border: 1px solid #1b1b1b;
		color: white;
	}

	#resources > small,
	#selectedUnit > small {
		display: block;
		color: gray;
	}

	#resources > div,
	#selectedUnit > .info {
		display: block;
		margin: 5px 0 15px;
	}

	.message {
		position: absolute;
		top: 100px;
		left: 0;
		right: 0;
		width: 200px;
		text-align: center;
		margin: 0px auto;
		background-color: #0a0a0a;
		border: 1px solid #1b1b1b;
		color: white;
	}

	.message > p {
		margin: 20px;
	}

	.welcomeMessage {
		position: absolute;
		top: 100px;
		left: 0;
		right: 0;
		width: 500px;
		text-align: left;
		margin: 0px auto;
		background-color: #0a0a0a;
		border: 1px solid #1b1b1b;
		color: white;
		padding: 20px;
	}

	.welcomeMessage > p {
		margin: 30px 0;
	}

	p.withImage {
		margin: 20px 0;
		height: 80px;
		background-repeat: no-repeat;
		background-size: 80px;
		padding-left: 120px;
	}

	#gameOver {
		top: 300px;
	}

	#unitsGroup {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		max-width: 400px;
	}

	#unitsGroup > div {
		height: 50px;
		width: 50px;
		border: 1px solid #8d8d8d;
		margin: 3px;
		background-image: url('/unitIcon.png');
		background-size: contain;
	}

	#selectedUnitOptions > small {
		color: gray;
		margin-bottom: 10px;
		display: block;
	}
</style>
