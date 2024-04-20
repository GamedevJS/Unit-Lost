<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { InstancedMesh, Instance } from '@threlte/extras';
	import { selectedUnit, units } from '$lib/stores';
	import { Vector3, InstancedMesh as InstancedMeshType } from 'three';
	import type { Unit } from '$lib/types';
	import { deepCloneAttribute } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

	export let moveTarget: Vector3;

	let arrayUpdated = false;
	let distance = 0;
	let unitsMesh: InstancedMeshType;
	let ringsMesh: InstancedMeshType;
	let attackPointOpacity = 0;
	let attackPoint = new Vector3();
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

	const selectUnit = (su: string | string[]) => {
		if (su === undefined) return;
		if (typeof su === 'string') {
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
	};

	$: selectUnit($selectedUnit);

	const moveUnits = (destination: Vector3) => {
		if (!destination) return;
		let unitCount = -1;
		$units.forEach((unit, i) => {
			if (unit.selected && unit.factionId === 0) {
				unitCount++;
				unit.moveTo.set(destination.x + unitCount / 3, 0.25, destination.z + unitCount / 3);
				unit.state = 'moving';
				unit.targetId = '';
			}
		});
		$units = $units;
	};

	$: moveUnits(moveTarget);

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

	const findTarget = (targetId: string) => {
		let targetIndex = $units.findIndex((sibling) => {
			return sibling.id === targetId;
		});
		return { target: $units[targetIndex], targetIndex };
	};

	const setStateIdle = (unit: Unit) => {
		unit.state = 'idle';
		unit.targetId = '';
		unit.color = 'white';
		return unit;
	};

	const setStateAttacking = (unit: Unit, targetId: string) => {
		unit.state = 'attacking';
		unit.color = 'orange';
		unit.targetId = targetId;
		return unit;
	};

	const setStateMoving = (unit: Unit, targetId = '', moveTo?: Vector3) => {
		unit.state = 'moving';
		unit.color = 'blue';
		if (targetId) unit.targetId = targetId;
		return unit;
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
				if (unit.targetId) {
					// folowing a target
					({ target } = findTarget(unit.targetId));
					if (!target) {
						// target is dead
						unit = setStateIdle(unit);
						return;
					}
					displacement.subVectors(target.currentPosition, unit.currentPosition);
					distance = displacement.length();
					if (distance > 2.5) {
						unit.currentPosition.add(
							moveVelocity(unit.currentPosition, target.currentPosition, delta * 2)
						);
					} else {
						unit = setStateAttacking(unit, target.id);
					}
				} else {
					// moving to cursor click
					unit.currentPosition.add(moveVelocity(unit.currentPosition, unit.moveTo, delta * 2));
					unit.color = 'blue';
					if (distance < 0.1) {
						closeEnemy = findCloseEnemy(unit);
						if (closeEnemy) {
							unit = setStateAttacking(unit, closeEnemy.id);
						} else {
							unit = setStateIdle(unit);
						}
					}
				}
			} else if (unit.state === 'idle') {
				if (!scanForEnemies) return;
				// is enemy nearby?
				closeEnemy = findCloseEnemy(unit);
				if (closeEnemy) {
					arrayUpdated = true;
					unit = setStateAttacking(unit, closeEnemy.id);
				}
			} else if (unit.state === 'attacking') {
				arrayUpdated = true;
				({ target, targetIndex } = findTarget(unit.targetId));
				if (!target) {
					// target is dead
					unit = setStateIdle(unit);
					return;
				}
				$units[targetIndex].health -= delta;
				displacement.subVectors(target.currentPosition, unit.currentPosition);
				distance = displacement.length();
				if (distance > 3) {
					// follow target
					if (unit.targetId && unit.hold == false) {
						unit = setStateMoving(unit, unit.targetId);
						unit.color = 'green';
					} else {
						unit = setStateIdle(unit);
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
		attackPointOpacity -= delta * 2;
	});
</script>

<InstancedMesh name="units" bind:ref={unitsMesh}>
	{#each $units as unit, i (unit.id)}
		<Instance
			on:pointerup={(e) => {
				e.stopPropagation();
				if (e.nativeEvent.button === 0) {
					$selectedUnit = unit.id;
				} else if (e.nativeEvent.button === 2) {
					if (unit.factionId === 0) return;
					let unitWillAttack = false;
					$units.forEach((u, index, object) => {
						if (u.selected) {
							object[index] = setStateMoving(object[index], unit.id);
							unitWillAttack = true;
						}
					});
					$units = $units;
					if (unitWillAttack) {
						console.log(e.object.position.x);
						attackPoint = e.object.position;
						attackPointOpacity = 1;
					}
				}
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

<T.Mesh
	name="attack point"
	rotation.x={-1.57}
	scale={0.3}
	position.x={attackPoint.x}
	position.z={attackPoint.z}
>
	<T.RingGeometry args={[0.8, 1, 24, 1]} />
	<T.MeshStandardMaterial color="red" transparent opacity={attackPointOpacity} />
</T.Mesh>
