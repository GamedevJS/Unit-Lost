<script lang="ts">
	import { T, useTask, useThrelte } from '@threlte/core';
	import { Grid, interactivity, useFBO, useTexture } from '@threlte/extras';
	import { Mesh, Vector3, Raycaster, Vector2, Quaternion, Euler, Matrix4 } from 'three';
	import {
		gameTime,
		dragBox,
		cursorPosition,
		units,
		selectedUnits,
		game,
		cursorGroundPosition,
		creditDrops,
		unplacedBuildingPosition,
		message
	} from '$lib/stores';
	import { generateId, isPointInside, findClosestUnit, isPointInSquareRadius } from '$lib/utils';
	import type { Point, Unit } from '$lib/types';
	import { onDestroy } from 'svelte';
	import { dev } from '$app/environment';

	import Peformance from './utils/Peformance.svelte';
	import Units from './Units.svelte';
	import Camera from './Camera.svelte';
	import SplatMaterial from '$lib/components/materials/splat/SplatMaterial.svelte';
	import MiniMap from './MiniMap.svelte';
	import { interval } from '$lib/animation';

	interactivity();

	const blendImage = useTexture('groundSplat.png');
	//const blendImage = useTexture('black.png');

	const { camera } = useThrelte();

	let mouseDown = false;
	let mouseDragged = false;
	let mouseDownPosition = new Vector2();
	let moveTarget = new Vector3();
	let movePointOpacity = 0;
	let canvasTexture: any;
	let time = 0;
	let ground: Mesh;
	const cursorOffset = new Vector3(0.3, 0, 0.3);
	let selectPoint = new Vector3();
	const raycaster = new Raycaster();
	let groundSelectionPoints: Point[] = [];
	let gridPosition = new Vector3();
	let gridVisible = false;
	let gridType: 'grid' | 'circular' = 'grid';
	let gridWhite = false;
	let gridRadius = 1;
	let waveCount = 0;

	const setGridPosition = (su: any, upbp: any, pb: any) => {
		gridVisible = false;
		if (!pb && su.units[0] && su.units[0].isBuilding) {
			gridType = 'circular';
			gridPosition.set(su.units[0].currentPosition.x, 0, su.units[0].currentPosition.z);
			gridPosition = gridPosition;
			gridVisible = true;
			gridWhite = !(su.units[0].typeId === 102);
			gridRadius = su.units[0].typeId === 101 ? 2 : 1;
		}
		if (pb && upbp) {
			gridType = upbp.typeId === 102 ? 'circular' : 'grid';
			gridPosition.set(upbp.x, 0, upbp.z);
			gridPosition = gridPosition;
			gridVisible = true;
			gridWhite = false;
		}
	};

	$: setGridPosition($selectedUnits, $unplacedBuildingPosition, $game.placingBuilding);

	const startWave = () => {
		waveCount++;
		$message = 'Wave ' + waveCount;
		let rotationMatrix = new Matrix4();
		let rotateDestination = new Quaternion();
		let startingPosition = new Vector3();
		let middleOfMap = new Vector3();
		let upVector = new Vector3(0, 1, 0);
		for (let i = 0; i < 4; i++) {
			startingPosition.set(Math.random() * 50 - 25, 0.25, Math.random() * 50 - 25);
			rotationMatrix.lookAt(startingPosition, middleOfMap, upVector);
			rotateDestination.setFromRotationMatrix(rotationMatrix);
			$units.push({
				id: generateId(),
				typeId: 1,
				targetId: '',
				factionId: 1,
				selected: false,
				moveTo: middleOfMap.clone(),
				quaternion: new Quaternion(),
				euler: new Euler(),
				rotateDestination: rotateDestination.clone(),
				currentPosition: startingPosition.clone(),
				state: 'moving',
				color: 'white',
				hold: false,
				attackMove: true,
				health: 10,
				maxHealth: 10,
				visible: false,
				distance: 0,
				isBuilding: false
			});
		}
		$creditDrops = [];
		for (let i = 0; i < 3; i++) {
			$creditDrops.push({
				id: generateId(),
				creditAmount: 10,
				currentPosition: new Vector3(Math.random() * 50 - 25, 0, Math.random() * 50 - 25)
			});
		}
	};

	// starting citidel
	$units.push({
		id: generateId(),
		typeId: 101,
		targetId: '',
		factionId: 0,
		selected: false,
		moveTo: new Vector3(),
		quaternion: new Quaternion(),
		euler: new Euler(),
		currentPosition: new Vector3(0.5, 0.25, 0.5),
		state: 'idle',
		color: 'white',
		hold: false,
		attackMove: false,
		health: 100,
		maxHealth: 100,
		visible: false,
		distance: 0,
		isBuilding: true,
		hasPower: true
	});

	// starting power station
	$units.push({
		id: generateId(),
		typeId: 102,
		targetId: '',
		factionId: 0,
		selected: false,
		moveTo: new Vector3(),
		quaternion: new Quaternion(),
		euler: new Euler(),
		currentPosition: new Vector3(-1.5, 0.25, -0.5),
		state: 'idle',
		color: 'white',
		hold: false,
		attackMove: false,
		health: 10,
		maxHealth: 10,
		visible: false,
		distance: 0,
		isBuilding: true
	});

	const displacement = new Vector3();
	let distance = 0;

	const selectSingle = (groundLastPosition: Vector3, mouseBtn: number) => {
		const closeUnits: Unit[] = [];
		selectPoint.copy(groundLastPosition);
		selectPoint.add(cursorOffset);
		selectPoint = selectPoint;
		$units.forEach((unit) => {
			displacement.subVectors(groundLastPosition, unit.currentPosition);
			distance = displacement.length();
			if (
				distance < 1 &&
				(unit.visible || unit.factionId === 0) &&
				!(unit.factionId === 0 && mouseBtn === 2)
			) {
				closeUnits.push(unit);
			}
		});

		if (closeUnits.length === 1) {
			$selectedUnits = { units: [closeUnits[0]], mouseBtn: mouseBtn };
			return true;
		} else if (closeUnits.length > 1) {
			const cu = findClosestUnit(groundLastPosition, closeUnits);
			if (!cu) return false;
			$selectedUnits = { units: [cu], mouseBtn: mouseBtn };
			return true;
		}
		return false;
	};

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

		let sUnits: Unit[] = [];
		$units.forEach((unit) => {
			if (
				isPointInside(
					{ x: unit.currentPosition.x, z: unit.currentPosition.z },
					groundSelectionPoints
				) &&
				!unit.isBuilding
			) {
				sUnits.push(unit);
			}
		});
		$selectedUnits = { units: sUnits, mouseBtn: 0 };
	};

	const every10seconds = interval(10);

	useTask((delta) => {
		movePointOpacity -= delta * 2;
		time += delta;
		$gameTime = time * 1000;

		every10seconds(delta, () => {
			startWave();
		});
	});

	onDestroy(() => {
		$units = [];
	});
</script>

{#if dev}
	<Peformance />
{/if}

<Camera />

<!-- <Fog /> -->
<MiniMap bind:canvasTexture />

<T.DirectionalLight intensity={3} position={[5, 10, 8]} />
<T.AmbientLight intensity={0.6} />

<!-- <T.Mesh scale={0.3} position.x={selectPoint.x} position.z={selectPoint.z}>
	<T.BoxGeometry />
	<T.MeshStandardMaterial color="red" />
</T.Mesh> -->
<!-- {#each groundSelectionPoints as gsp}
	<T.Mesh scale={0.3} position.x={gsp.x} position.z={gsp.z}>
		<T.BoxGeometry />
		<T.MeshStandardMaterial color="red" />
	</T.Mesh>
{/each} -->

<!-- visible={$game.placingBuilding} -->
<Grid
	type={gridType}
	visible={gridVisible}
	gridSize={gridType === 'grid' ? [2, 2] : [8, 8]}
	maxRadius={gridWhite ? gridRadius : 3}
	sectionSize={gridType === 'grid' ? 0 : gridWhite ? gridRadius : 3}
	cellColor={'#4d6ca6'}
	cellSize={1}
	sectionColor={gridWhite ? '#ffffff' : '#025afb'}
	sectionThickness={3}
	position.x={gridPosition.x}
	position.y={0}
	position.z={gridPosition.z}
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
			mouseDownPosition.set(e.pointer.x, e.pointer.y);
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
		$cursorGroundPosition.x = e.point.x;
		$cursorGroundPosition.z = e.point.z;
		mouseDragged = mouseDown;
	}}
	on:pointerup={(e) => {
		if (e.nativeEvent.button === 2) {
			// right mouse btn
			if ($selectedUnits.units.find((u) => u.isBuilding)) return; // add rally point?
			if (selectSingle(e.point, 2)) {
				return;
			}
			moveTarget.set(e.point.x, 0.25, e.point.z);
			moveTarget = moveTarget;
			if ($selectedUnits.units.length > 0) movePointOpacity = 1;
		} else if (e.nativeEvent.button === 0) {
			// left mouse btn

			if ($game.placingBuilding) {
				moveTarget.set(e.point.x, 0, e.point.z);
				moveTarget = moveTarget;
				return;
			}

			$dragBox.mouseDown = false;
			mouseDown = false;
			$selectedUnits.units = [];
			if (mouseDragged) {
				selectArea(e.pointer, e.point);
			} else {
				selectSingle(e.point, 0);
			}
		}
	}}
>
	<T.BoxGeometry />
	<!-- 	{#await blendImage then blendImage}
		<SplatMaterial
			images={{
				image0: 'dirt.png',
				image1: 'rock.png',
				image2: 'cracks.png',
				image3: 'dirtDark.png'
			}}
			repeat={18}
			{blendImage}
			{canvasTexture}
			noiseOffset={time / 5}
			opacity={0.2}
		/> 
		
	{/await} -->
	{#await blendImage then blendImage}
		<SplatMaterial
			colors={[
				[0.051, 0.055, 0.09],
				[0.059, 0.071, 0.11],
				[0.071, 0.078, 0.129]
			]}
			repeat={18}
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
	position.y={0.01}
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
