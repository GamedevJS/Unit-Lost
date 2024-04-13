<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { InstancedMesh, Instance } from '@threlte/extras';
	import { selectedUnit, units } from '$lib/stores';
	import { Vector3 } from 'three';

	let arrayUpdated = false;
	let distance = 0;
	const displacement = new Vector3();
	const velocity = new Vector3();

	const moveVelocity = (start: Vector3, end: Vector3, speed: number) => {
		displacement.subVectors(end, start);
		distance = displacement.length();
		if (distance > 0.1) {
			velocity.subVectors(end, start).normalize();
			return velocity.multiplyScalar(speed);
		} else {
			return velocity.set(0, 0, 0);
		}
	};

	const selectUnit = (su: number | number[]) => {
		if (!su) return;
		if (typeof su === 'number') {
			$units.forEach((unit) => {
				unit.selected = unit.id === su ? true : false;
			});
		} else {
			$units.forEach((unit) => {
				unit.selected = su.includes(unit.id) ? true : false;
			});
		}
		$units = $units;
	};

	$: selectUnit($selectedUnit);

	useTask((delta) => {
		$units.forEach((unit) => {
			if (unit.moving) {
				arrayUpdated = true;
				unit.currentPosition.add(moveVelocity(unit.currentPosition, unit.moveTo, delta * 2));
				if (distance < 0.1) unit.moving = false;
			}
		});
		if (arrayUpdated) $units = $units;
		arrayUpdated = false;
	});
</script>

<InstancedMesh name="units">
	{#each $units as unit, i (unit.id)}
		<Instance
			on:pointerup={(e) => {
				//selected = true;
				e.stopPropagation();
				$selectedUnit = unit.id;
			}}
			on:pointerdown={(e) => {
				e.stopPropagation();
			}}
			position={[unit.currentPosition.x, 0.25, unit.currentPosition.z]}
		/>
	{/each}
	<T.IcosahedronGeometry args={[0.15, 1]} />
	<T.MeshStandardMaterial color="#F85122" flatShading />
</InstancedMesh>
