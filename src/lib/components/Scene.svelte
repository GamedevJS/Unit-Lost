<script lang="ts">
	import { T, useTask, useThrelte } from '@threlte/core';
	import { Grid, interactivity, useTexture } from '@threlte/extras';
	import { BoxGeometry, Mesh, MeshStandardMaterial, Vector3 } from 'three';
	import { dragBox, cursorPosition, units, selectedUnit, game } from '$lib/stores';
	import { generateId } from '$lib/utils';
	import { SelectionBox } from 'three/examples/jsm/interactive/SelectionBox.js';

	import { onDestroy } from 'svelte';

	import Peformance from './utils/Peformance.svelte';
	import Units from './Units.svelte';
	import Camera from './Camera.svelte';
	import SplatMaterial from '$lib/components/materials/splat/SplatMaterial.svelte';
	import Fog from './Fog.svelte';
	import MiniMap from './MiniMap.svelte';

	interactivity();

	const blendImage = useTexture('groundSplat.png');

	const { camera, scene, size } = useThrelte();
	let selectBox = new SelectionBox($camera, scene);

	let mouseDown = false;
	let mouseDragged = false;
	let collection: any[] = [];
	let moveTarget = new Vector3();
	let movePointOpacity = 0;
	let canvasTexture: any;
	let time = 0;

	let row = -10;
	let col = -10;
	let unitCount = 50;
	for (let i = 0; i < unitCount; i++) {
		row++;
		if (row > 10) {
			row = -10;
			col++;
		}
		$units.push({
			id: generateId(),
			factionId: 0,
			targetId: '',
			selected: false,
			moveTo: new Vector3(row, 0.25, col),
			currentPosition: new Vector3(row, 0.25, col),
			state: 'idle',
			color: 'white',
			hold: false,
			health: 1,
			visible: false,
			distance: 0
		});
	}
	col = 5;
	for (let i = 0; i < unitCount; i++) {
		row++;
		if (row > 10) {
			row = -10;
			col++;
		}
		$units.push({
			id: generateId(),
			targetId: '',
			factionId: 1,
			selected: false,
			moveTo: new Vector3(row, 0.25, col),
			currentPosition: new Vector3(row, 0.25, col),
			state: 'idle',
			color: 'white',
			hold: false,
			health: 1,
			visible: false,
			distance: 0
		});
	}

	const selectArea = () => {
		selectBox.camera = $camera;
		selectBox.startPoint.set(
			($dragBox.x / $size.width) * 2 - 1,
			-($dragBox.y / $size.height) * 2 + 1,
			0.5
		);
		selectBox.endPoint.set(
			($cursorPosition.x / $size.width) * 2 - 1,
			-($cursorPosition.y / $size.height) * 2 + 1,
			0.5
		);
		collection = selectBox.select();
		// @ts-ignore
		let selectedInstances = Object.values(selectBox.instances)[0] as number[];
		let selectedUnits: string[] = [];
		selectedInstances.forEach((index) => {
			selectedUnits.push($units[index].id);
		});
		$selectedUnit = selectedUnits;
		/* selectedInstances.forEach((id) => {
			//	selectUnit(id, true);
		}); */
	};

	useTask((delta) => {
		movePointOpacity -= delta * 2;
		time += delta;
	});

	onDestroy(() => {
		$units = [];
	});
</script>

<Peformance />

<Camera />

<!-- <Fog /> -->
<MiniMap bind:canvasTexture />

<T.DirectionalLight intensity={3} position={[5, 10, 8]} />
<T.AmbientLight intensity={0.6} />

<Grid
	gridSize={[50, 50]}
	cellColor={'#46536b'}
	sectionColor="#ffffff"
	sectionThickness={0}
	fadeDistance={50}
	position.y={-0.01}
/>

<Units {moveTarget} />

<T.Mesh
	name="ground"
	scale={[70, 0.1, 70]}
	position={-0.1}
	on:pointerdown={(e) => {
		if (e.nativeEvent.button === 0) {
			// left mouse btn
			$dragBox.mouseDown = true;
			mouseDown = true;
			mouseDragged = false;
			$dragBox.x = e.nativeEvent.clientX;
			$dragBox.y = e.nativeEvent.clientY;
		}
	}}
	on:pointermove={(e) => {
		$cursorPosition.x = e.nativeEvent.clientX;
		$cursorPosition.y = e.nativeEvent.clientY;
		if (mouseDown) {
			mouseDragged = true;
		}
	}}
	on:pointerup={(e) => {
		if (e.nativeEvent.button === 2) {
			// right mouse btn
			moveTarget.set(e.point.x, 0, e.point.z);
			moveTarget = moveTarget;

			if (
				(typeof $selectedUnit === 'number' && $selectedUnit > -1) ||
				(Array.isArray($selectedUnit) && $selectedUnit.length > 0)
			)
				movePointOpacity = 1;
		} else if (e.nativeEvent.button === 0) {
			// left mouse btn
			$dragBox.mouseDown = false;
			mouseDown = false;
			$selectedUnit = '';
			if (mouseDragged) selectArea();
		}
	}}
>
	<T.BoxGeometry />
	{#await blendImage then blendImage}
		<SplatMaterial
			images={{
				image1: 'brick.png',
				image2: 'rock.png',
				image3: 'grass.png'
			}}
			repeat={15}
			{blendImage}
			{canvasTexture}
			noiseOffset={time / 5}
			opacity={0.2}
		/>
	{/await}
</T.Mesh>

<T.Mesh
	name="move point"
	rotation.x={-1.57}
	scale={0.3}
	position.x={moveTarget.x}
	position.z={moveTarget.z}
>
	<T.RingGeometry args={[0.8, 1, 24, 1]} />
	<T.MeshStandardMaterial color="green" transparent opacity={movePointOpacity} />
</T.Mesh>

<svelte:window
	on:mouseup={() => {
		$dragBox.mouseDown = false;
		mouseDown = false;
	}}
/>
