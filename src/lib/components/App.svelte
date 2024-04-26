<script lang="ts">
	import { Canvas } from '@threlte/core';
	import { game, units, cameraGroundPosition } from '$lib/stores';
	import { generateId } from '$lib/utils';
	import { Vector3, Quaternion, Euler } from 'three';
	import Scene from './Scene.svelte';
	import DragBox from './ui/DragBox.svelte';
	import StatusBoxes from './ui/StatusBoxes.svelte';
	import { onMount } from 'svelte';
	import { dev } from '$app/environment';

	/* 	onMount(() => {
		// @ts-ignore
		window.addUnit = (factionId = 0) => {
			let id = generateId();
			$units.push({
				id: id,
				typeId: 1,
				factionId: factionId,
				targetId: '',
				selected: false,
				moveTo: new Vector3($cameraGroundPosition.x, 0.25, $cameraGroundPosition.z),
				quaternion: new Quaternion(),
				euler: new Euler(),
				currentPosition: new Vector3($cameraGroundPosition.x, 0.25, $cameraGroundPosition.z),
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
			console.log('unit added: ', id, ' at: ', $cameraGroundPosition.x, $cameraGroundPosition.z);
		};
		// @ts-ignore
		window.addBuilding = () => {
			$units.push({
				id: generateId(),
				typeId: 1,
				factionId: 0,
				targetId: '',
				selected: false,
				moveTo: new Vector3($cameraGroundPosition.x, 0.25, $cameraGroundPosition.z),
				quaternion: new Quaternion(),
				euler: new Euler(),
				currentPosition: new Vector3($cameraGroundPosition.x, 0.25, $cameraGroundPosition.z),
				state: 'idle',
				color: 'white',
				hold: false,
				health: 10,
				maxHealth: 10,
				distance: 0,
				visible: false,
				isBuilding: true
			});
			$units = $units;
			console.log('building added at: ', $cameraGroundPosition.x, $cameraGroundPosition.z);
		};
	}); */
</script>

<DragBox />

<!-- <MiniMap /> -->
<div id="miniMapContainer" style:position="absolute" style:bottom="20px" style:right="20px"></div>

<StatusBoxes />

<Canvas>
	<Scene />
</Canvas>

<svelte:window
	on:keypress={(e) => {
		if (e.key === 'd' && dev) {
			$game.dev = !$game.dev;
		}
		if (e.key === 'c' && dev) {
			$game.useEdgeCamera = !$game.useEdgeCamera;
		}
	}}
/>
