<script lang="ts">
	import { T, useTask, useThrelte } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';
	import { game, cursorPosition, cameraPosition, cameraGroundPosition } from '$lib/stores';
	import { Vector3 } from 'three';

	const { size } = useThrelte();
	const position = new Vector3(20, 30, 20);
	const moveSpeed = 8;

	let moveLeft = false;
	let moveRight = false;
	let moveUp = false;
	let moveDown = false;
	let cameraMoved = false;

	const cursorPositionChanged = (cp: any) => {
		moveLeft = cp.x < $size.width / 10 ? true : false;
		moveRight = cp.x > ($size.width / 10) * 9 ? true : false;
		moveUp = cp.y < $size.height / 10 ? true : false;
		moveDown = cp.y > ($size.height / 10) * 9 ? true : false;
	};

	$: cursorPositionChanged($cursorPosition);

	const cameraPositionChanged = (cp: any) => {
		if (!cp.setByMap) return;
		position.x = cp.x;
		position.z = cp.z;
	};

	$: cameraPositionChanged($cameraPosition);

	useTask((delta) => {
		if (!$game.useEdgeCamera) return;
		cameraMoved = true;
		if (moveLeft && moveUp) {
			position.x -= delta * moveSpeed * 1.5;
		} else if (moveRight && moveDown) {
			position.x += delta * moveSpeed * 1.5;
		} else if (moveLeft && moveDown) {
			position.z += delta * moveSpeed * 1.5;
		} else if (moveRight && moveUp) {
			position.z -= delta * moveSpeed * 1.5;
		} else if (moveLeft) {
			position.x -= delta * moveSpeed;
			position.z += delta * moveSpeed;
		} else if (moveRight) {
			position.x += delta * moveSpeed;
			position.z -= delta * moveSpeed;
		} else if (moveUp) {
			position.x -= delta * moveSpeed;
			position.z -= delta * moveSpeed;
		} else if (moveDown) {
			position.x += delta * moveSpeed;
			position.z += delta * moveSpeed;
		} else {
			cameraMoved = false;
		}
		if (cameraMoved) {
			position.x = position.x > 40 ? 40 : position.x;
			position.x = position.x < 0 ? 0 : position.x;
			position.z = position.z > 40 ? 40 : position.z;
			position.z = position.z < 0 ? 0 : position.z;
			$cameraPosition = { x: position.x, z: position.z, setByMap: false };
			//console.log('-- camera --', $cameraPosition, $cameraGroundPosition);
		}
	});
</script>

<T.PerspectiveCamera
	name="main camera"
	makeDefault={!$game.dev}
	position={[position.x, position.y, position.z]}
	fov={15}
	on:create={({ ref }) => {
		ref.lookAt(0, 0, 0);
	}}
/>

<T.PerspectiveCamera makeDefault={$game.dev} name="dev camera" position={[20, 20, 20]} fov={15}>
	<OrbitControls />
</T.PerspectiveCamera>
