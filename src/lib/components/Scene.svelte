<script lang="ts">
	import { T, useTask, useThrelte } from '@threlte/core';
	import {
		Grid,
		interactivity,
		OrbitControls,
		Outlines,
		InstancedMesh,
		Instance
	} from '@threlte/extras';
	import { BoxGeometry, Mesh, MeshStandardMaterial, Vector3 } from 'three';
	import { dragBox, cursorPosition, units, selectedUnit, game } from '$lib/stores';
	import { SelectionBox } from 'three/examples/jsm/interactive/SelectionBox.js';
	import { onDestroy } from 'svelte';

	import Peformance from './utils/Peformance.svelte';
	import Units from './Units.svelte';
	import Camera from './Camera.svelte';

	interactivity();

	const { camera, scene, size } = useThrelte();
	let selectBox = new SelectionBox($camera, scene);

	let mouseDown = false;
	let mouseDragged = false;
	let collection: any[] = [];

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
			id: i,
			factionId: 0,
			targetId: 0,
			selected: true,
			moveTo: new Vector3(row, 0.25, col),
			currentPosition: new Vector3(row, 0.25, col),
			state: 'idle',
			color: 'white',
			hold: false,
			health: 1
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
			id: i + unitCount,
			targetId: 0,
			factionId: 1,
			selected: true,
			moveTo: new Vector3(row, 0.25, col),
			currentPosition: new Vector3(row, 0.25, col),
			state: 'idle',
			color: 'white',
			hold: true,
			health: 1
		});
	}

	const moveUnits = (x: number, z: number) => {
		let unitCount = -1;
		$units.forEach((unit, i) => {
			if (unit.selected && unit.factionId === 0) {
				unitCount++;
				unit.moveTo.set(x + unitCount / 3, 0.25, z + unitCount / 3);
				unit.state = 'moving';
				unit.targetId = -1;
			}
		});
		$units = $units;
	};

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
		$selectedUnit = selectedInstances;
		/* selectedInstances.forEach((id) => {
			//	selectUnit(id, true);
		}); */
	};

	onDestroy(() => {
		$units = [];
	});
</script>

<Peformance />

<Camera />

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

<Units />

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
			moveUnits(e.point.x, e.point.z);
		} else if (e.nativeEvent.button === 0) {
			// left mouse btn
			$dragBox.mouseDown = false;
			mouseDown = false;
			$selectedUnit = -1;
			if (mouseDragged) selectArea();
		}
	}}
>
	<T.BoxGeometry />
	<T.MeshBasicMaterial visible={false} />
</T.Mesh>

<svelte:window
	on:mouseup={() => {
		$dragBox.mouseDown = false;
		mouseDown = false;
	}}
/>
