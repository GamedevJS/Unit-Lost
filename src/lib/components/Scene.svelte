<script lang="ts">
	import { T, useTask, useThrelte } from '@threlte/core';
	import { Grid, interactivity, useTexture } from '@threlte/extras';
	import { Mesh, Vector3, Raycaster, Vector2 } from 'three';
	import { dragBox, cursorPosition, units, selectedUnit, game } from '$lib/stores';
	import { generateId, isPointInside } from '$lib/utils';
	import type { Point } from '$lib/types';

	import { onDestroy } from 'svelte';

	import Peformance from './utils/Peformance.svelte';
	import Units from './Units.svelte';
	import Camera from './Camera.svelte';
	import SplatMaterial from '$lib/components/materials/splat/SplatMaterial.svelte';
	import MiniMap from './MiniMap.svelte';

	interactivity();

	const blendImage = useTexture('groundSplat.png');

	const { camera } = useThrelte();

	let mouseDown = false;
	let mouseDragged = false;
	let mouseDownPosition = new Vector2();
	let moveTarget = new Vector3();
	let movePointOpacity = 0;
	let canvasTexture: any;
	let time = 0;
	let ground: Mesh;
	const raycaster = new Raycaster();
	let groundSelectionPoints: Point[] = [];

	let row = -10;
	let col = -10;
	let unitCount = 100;
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
			distance: 0,
			isBuilding: false
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
			distance: 0,
			isBuilding: false
		});
	}

	$units.push({
		id: generateId(),
		targetId: '',
		factionId: 0,
		selected: false,
		moveTo: new Vector3(),
		currentPosition: new Vector3(0.5, 0, 0.5),
		state: 'idle',
		color: 'white',
		hold: false,
		health: 1,
		visible: false,
		distance: 0,
		isBuilding: true
	});

	const selectArea = (mouseUpPosition: Vector2, groundLastPosition: Vector3) => {
		groundSelectionPoints.length = 0;
		raycaster.setFromCamera(new Vector2(mouseDownPosition.x, mouseDownPosition.y), $camera);
		groundSelectionPoints.push({
			x: raycaster.intersectObject(ground)[0].point.x,
			z: raycaster.intersectObject(ground)[0].point.z
		});
		raycaster.setFromCamera(new Vector2(mouseDownPosition.x, mouseUpPosition.y), $camera);
		groundSelectionPoints.push({
			x: raycaster.intersectObject(ground)[0].point.x,
			z: raycaster.intersectObject(ground)[0].point.z
		});
		groundSelectionPoints.push({
			x: groundLastPosition.x,
			z: groundLastPosition.z
		});
		raycaster.setFromCamera(new Vector2(mouseUpPosition.x, mouseDownPosition.y), $camera);
		groundSelectionPoints.push({
			x: raycaster.intersectObject(ground)[0].point.x,
			z: raycaster.intersectObject(ground)[0].point.z
		});

		let selectedUnits: string[] = [];
		$units.forEach((unit) => {
			if (
				isPointInside(
					{ x: unit.currentPosition.x, z: unit.currentPosition.z },
					groundSelectionPoints
				)
			) {
				selectedUnits.push(unit.id);
			}
		});
		$selectedUnit = selectedUnits;
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

<!-- {#each groundSelectionPoints as gsp}
	<T.Mesh scale={0.3} position.x={gsp.x} position.z={gsp.z}>
		<T.BoxGeometry />
		<T.MeshStandardMaterial color="red" />
	</T.Mesh>
{/each} -->

<Grid
	gridSize={[50, 50]}
	cellColor={'#46536b'}
	sectionColor="#ffffff"
	sectionThickness={0}
	fadeDistance={50}
	position.y={0}
/>

<Units {moveTarget} />

<T.Mesh
	name="ground"
	scale={[70, 0.1, 70]}
	position={-0.1}
	bind:ref={ground}
	on:pointerdown={(e) => {
		if (e.nativeEvent.button === 0) {
			// left mouse btn
			$dragBox.mouseDown = true;
			mouseDownPosition.set(e.pointer.x, e.pointer.y);
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
			if (mouseDragged) selectArea(e.pointer, e.point);
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
