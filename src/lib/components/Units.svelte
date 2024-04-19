<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { InstancedMesh, Instance } from '@threlte/extras';
	import { selectedUnit, units } from '$lib/stores';
	import { Vector3, InstancedMesh as InstancedMeshType } from 'three';
	import { interval } from '$lib/animation';
	import type { Unit } from '$lib/types';

	let arrayUpdated = false;
	let distance = 0;
	let unitsMesh: InstancedMeshType;
	let ringsMesh: InstancedMeshType;
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
				unit.selected = false;
				if (unit.factionId === 0 && su.includes(unit.id)) unit.selected = true;
			});
		}
		$units = $units;
		console.log(ringsMesh);
	};

	$: selectUnit($selectedUnit);

	const findCloseEnemy = (unit: Unit) => {
		for (let i = 0; i < $units.length; i++) {
			let sibling = $units[i];
			if (sibling.factionId !== unit.factionId) {
				displacement.subVectors(sibling.currentPosition, unit.currentPosition);
				distance = displacement.length();
				if (distance < 3) {
					return sibling;
				}
			}
		}
		return undefined;
	};

	const findTarget = (targetId: number) => {
		let targetIndex = $units.findIndex((sibling) => {
			return sibling.id === targetId;
		});
		return { target: $units[targetIndex], targetIndex };
	};

	// todo - try a counter system where we update a faction every 15 frames

	let closeEnemy: Unit | undefined;
	let target: Unit | undefined;
	let targetIndex: number | undefined;
	let scanForEnemies = true;
	useTask((delta) => {
		$units.forEach((unit, index, object) => {
			if (unit.state === 'moving') {
				arrayUpdated = true;

				if (unit.targetId > -1) {
					// folowing a target
					({ target } = findTarget(unit.targetId));
					if (!target) return;
					displacement.subVectors(target.currentPosition, unit.currentPosition);
					distance = displacement.length();
					if (distance > 2.5) {
						unit.currentPosition.add(
							moveVelocity(unit.currentPosition, target.currentPosition, delta * 2)
						);
					} else {
						unit.state = 'attacking';
						unit.color = 'orange';
					}
				} else {
					// moving to cursor click
					unit.currentPosition.add(moveVelocity(unit.currentPosition, unit.moveTo, delta * 2));
					unit.color = 'blue';
					if (distance < 0.1) {
						closeEnemy = findCloseEnemy(unit);
						if (closeEnemy) {
							unit.state = 'attacking';
							unit.targetId = closeEnemy.id;
							unit.color = 'orange';
							arrayUpdated = true;
						} else {
							unit.state = 'idle';
							unit.color = 'white';
						}
					}
				}
			} else if (unit.state === 'idle') {
				if (!scanForEnemies) return;
				// is enemy nearby?
				closeEnemy = findCloseEnemy(unit);
				if (closeEnemy) {
					unit.state = 'attacking';
					unit.targetId = closeEnemy.id;
					unit.color = 'orange';
					arrayUpdated = true;
				}
			} else if (unit.state === 'attacking') {
				arrayUpdated = true;
				({ target, targetIndex } = findTarget(unit.targetId));
				if (!target) {
					// target died
					console.log('dead');
					unit.state = 'idle';
					unit.targetId = -1;
					unit.color = 'white';
					return;
				}
				$units[targetIndex].health -= delta;
				displacement.subVectors(target.currentPosition, unit.currentPosition);
				distance = displacement.length();
				if (distance > 3) {
					// follow target
					if (unit.targetId > -1 && unit.hold == false) {
						unit.state = 'moving';
						unit.color = 'green';
					} else {
						unit.state = 'idle';
						unit.targetId = -1;
						unit.color = 'white';
					}
				}
			}
			if (unit.health < 0) {
				arrayUpdated = true;
				object.splice(index, 1);
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
