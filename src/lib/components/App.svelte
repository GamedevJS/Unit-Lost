<script lang="ts">
	import { Canvas } from '@threlte/core';
	import { game, units, cameraGroundPosition } from '$lib/stores';
	import { generateId } from '$lib/utils';
	import { Vector3 } from 'three';
	import Scene from './Scene.svelte';
	import DragBox from './ui/DragBox.svelte';
	import { onMount } from 'svelte';

	onMount(() => {
		// @ts-ignore
		window.addUnit = () => {
			$units.push({
				id: generateId(),
				factionId: 0,
				targetId: '',
				selected: false,
				moveTo: new Vector3($cameraGroundPosition.x, 0.25, $cameraGroundPosition.z),
				currentPosition: new Vector3($cameraGroundPosition.x, 0.25, $cameraGroundPosition.z),
				state: 'idle',
				color: 'white',
				hold: false,
				health: 1,
				distance: 0,
				visible: false
			});
			$units = $units;
			console.log('unit added at: ', $cameraGroundPosition.x, $cameraGroundPosition.z);
		};
	});
</script>

<DragBox />

<!-- <MiniMap /> -->
<div id="miniMapContainer" style:position="absolute" style:bottom="20px" style:right="20px"></div>

<Canvas>
	<Scene />
</Canvas>

<svelte:window
	on:keypress={(e) => {
		if (e.key === 'd') {
			$game.dev = !$game.dev;
		}
		if (e.key === 'c') {
			$game.useEdgeCamera = !$game.useEdgeCamera;
		}
	}}
/>
