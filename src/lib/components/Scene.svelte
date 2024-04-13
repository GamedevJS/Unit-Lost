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
	import { dragBox, units, selectedUnit } from '$lib/stores';
	import { SelectionBox } from 'three/examples/jsm/interactive/SelectionBox.js';
	import { onDestroy } from 'svelte';

	import Peformance from './utils/Peformance.svelte';
	import Units from './Units.svelte';

	interactivity();

	const { camera, scene, size } = useThrelte();
	let selectBox = new SelectionBox($camera, scene);

	let mouseDown = false;
	let mouseDragged = false;
	let collection: any[] = [];

	let row = -10;
	let col = -10;
	for (let i = 0; i < 50; i++) {
		row++;
		if (row > 10) {
			row = -10;
			col++;
		}
		$units.push({
			id: i,
			selected: true,
			moveTo: new Vector3(row, 0.25, col),
			currentPosition: new Vector3(row, 0.25, col),
			moving: false
		});
	}

	const moveUnits = (x: number, z: number) => {
		let unitCount = -1;
		$units.forEach((unit, i) => {
			if (unit.selected) {
				unitCount++;
				unit.moveTo.set(x + unitCount / 3, 0.25, z + unitCount / 3);
				unit.moving = true;
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
			($dragBox.moveX / $size.width) * 2 - 1,
			-($dragBox.moveY / $size.height) * 2 + 1,
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

<T.PerspectiveCamera makeDefault position={[20, 20, 20]} fov={15}>
	<OrbitControls enableRotate={true} />
</T.PerspectiveCamera>

<T.DirectionalLight intensity={3} position={[5, 10, 8]} />
<T.AmbientLight intensity={0.6} />

<Grid
	gridSize={[20, 20]}
	cellColor={'#46536b'}
	sectionColor="#ffffff"
	sectionThickness={0}
	fadeDistance={50}
	position.y={-0.01}
/>

<Units />
<!-- 
<InstancedMesh name="units">
	{#each $units as unit, i (unit.id)}
		<UnitInstance
			id={unit.id}
			moveTo={unit.moveTo}
			arrayPos={i}
			on:selected={(e) => {
				selectUnit(e.detail);
			}}
		/>
	{/each}
	<T.IcosahedronGeometry args={[0.3, 1]} />
	<T.MeshStandardMaterial color="#F85122" flatShading />
</InstancedMesh>

{#each $units as unit, i (unit.id)}
	<Unit
		id={unit.id}
		moveTo={unit.moveTo}
		selected={unit.selected}
		arrayPos={i}
		on:selected={(e) => {
			selectUnit(e.detail);
		}}
	/>
{/each} -->
<InstancedMesh>
	{#each $units as unit, i (unit.id)}
		{#if unit.selected}
			<Instance
				rotation.x={-1.57}
				scale={0.3}
				position={[unit.currentPosition.x, 0, unit.currentPosition.z]}
			/>
		{/if}
	{/each}
	<T.RingGeometry args={[0.8, 1, 12, 1]} />
	<T.MeshStandardMaterial />
</InstancedMesh>

<T.Mesh
	name="ground"
	scale={[20, 0.1, 20]}
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
		if (mouseDown) {
			mouseDragged = true;
			$dragBox.moveX = e.nativeEvent.clientX;
			$dragBox.moveY = e.nativeEvent.clientY;
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
			//	selectUnit();
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
