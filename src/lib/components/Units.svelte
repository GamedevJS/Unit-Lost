<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { InstancedMesh, Instance } from '@threlte/extras';
	import { selectedUnit, units } from '$lib/stores';
	import { Vector3, InstancedMesh as InstancedMeshType } from 'three';

	let arrayUpdated = false;
	let distance = 0;
	let unitsMesh: InstancedMeshType;
	let ringsMesh: InstancedMeshType;
	const displacement = new Vector3();
	const velocity = new Vector3();
	const enemyPosition = new Vector3(0, 0, 0);

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
		console.log(ringsMesh);
	};

	$: selectUnit($selectedUnit);

	useTask((delta) => {
		$units.forEach((unit) => {
			if (unit.state === 'moving') {
				arrayUpdated = true;
				unit.currentPosition.add(moveVelocity(unit.currentPosition, unit.moveTo, delta * 2));
				unit.color = 'blue';
				if (distance < 0.1) {
					unit.state = 'idle';
					unit.color = 'white';
				}
			} else if (unit.state === 'idle') {
				// is enemy nearby?
				displacement.subVectors(enemyPosition, unit.currentPosition);
				distance = displacement.length();
				if (distance < 3) {
					unit.state = 'attacking';
					unit.color = 'orange';
					arrayUpdated = true;
				}
			} else if (unit.state === 'attacking') {
			}
		});
		if (arrayUpdated) {
			$units = $units;
			if (unitsMesh) unitsMesh.computeBoundingSphere();
		}
		arrayUpdated = false;
	});
</script>

<InstancedMesh name="units" bind:ref={unitsMesh}>
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
			color={unit.color}
		/>
	{/each}
	<T.IcosahedronGeometry args={[0.15, 1]} />
	<T.MeshStandardMaterial color="#FFFFFF" />
</InstancedMesh>

<InstancedMesh name="selection rings" frustumCulled={false}>
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
