<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { InstancedMesh, Instance } from '@threlte/extras';
	import { selectedUnit, units } from '$lib/stores';
	import { Vector3, InstancedMesh as InstancedMeshType } from 'three';
	import { generateGrid } from '$lib/utils';
	import type { Unit } from '$lib/types';

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
		const unitCount = $units.filter((unit) => unit.selected && unit.factionId === 0).length;
		if (unitCount <= 0) return;
		const gridPositions = generateGrid(unitCount, { x: destination.x, y: destination.z });
		let gridCount = 0;
		$units.forEach((unit, i) => {
			if (unit.selected && unit.factionId === 0) {
				if (unitCount > 1) {
					destination.set(gridPositions[gridCount].x, destination.y, gridPositions[gridCount].y);
				}
				unit = setStateMoving(unit, '', unit.moveTo.copy(destination));
				gridCount++;
			}
		});
		$units = $units;
	};

	$: moveUnits(moveTarget);

	//let closestEnemy;
	let closeEnemies: Unit[];
	const findCloseEnemies = (unit: Unit) => {
		closeEnemies = [];
		for (let i = 0; i < $units.length; i++) {
			let sibling = $units[i];
			if (sibling.factionId !== unit.factionId) {
				displacement.subVectors(sibling.currentPosition, unit.currentPosition);
				distance = displacement.length();
				if (distance < 5) {
					sibling.distance = distance;
					closeEnemies.push(sibling);
					allFoundEnemies.push(sibling);
				}
			}
		}
		return closeEnemies;
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
		if (moveTo) unit.moveTo = moveTo;
		if (targetId) unit.targetId = targetId;
		return unit;
	};

	let foundEnemies: Unit[];
	let allFoundEnemies: Unit[] = [];
	let savedFoundEnemies: Unit[] = [];
	let enemyInFiringRange: Unit | undefined;
	let target: Unit | undefined;
	let targetIndex: number | undefined;
	useTask((delta) => {
		savedFoundEnemies = allFoundEnemies;
		allFoundEnemies = [];
		$units.forEach((unit, index, object) => {
			// is enemy nearby?
			foundEnemies = findCloseEnemies(unit);
			enemyInFiringRange = foundEnemies.find((u) => u.distance < 3);

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
						if (enemyInFiringRange) {
							unit = setStateAttacking(unit, enemyInFiringRange.id);
						} else {
							unit = setStateIdle(unit);
						}
					}
				}
			} else if (unit.state === 'idle') {
				if (enemyInFiringRange) {
					arrayUpdated = true;
					unit = setStateAttacking(unit, enemyInFiringRange.id);
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
			unit.visible = false;
			if (savedFoundEnemies.find((u) => u.id === unit.id)) {
				unit.visible = true;
			}
		});
		if (arrayUpdated) {
			$units = $units;
			if (unitsMesh) unitsMesh.computeBoundingSphere();
		}
		//arrayUpdated = false;
		attackPointOpacity -= delta * 2;
	});
</script>

<InstancedMesh name="units" bind:ref={unitsMesh}>
	{#each $units as unit, i (unit.id)}
		{#if unit.factionId === 0 || unit.visible}
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
		{/if}
	{/each}
	<T.IcosahedronGeometry args={[0.15, 1]} />
	<T.MeshStandardMaterial color="#FFFFFF" />
</InstancedMesh>

<InstancedMesh name="selection rings" frustumCulled={false}>
	{#each $units as unit, i (unit.id)}
		<Instance
			rotation.x={-1.57}
			scale={unit.selected ? 0.3 : 0}
			position={[unit.currentPosition.x, 0, unit.currentPosition.z]}
		/>
	{/each}
	<T.RingGeometry args={[0.8, 1, 24, 1]} />
	<T.MeshStandardMaterial />
</InstancedMesh>

<InstancedMesh name="health bars" frustumCulled={false}>
	{#each $units as unit, i (unit.id)}
		{#if (unit.factionId === 0 || unit.visible) && unit.health < 1}
			<Instance
				rotation.x={-1.57}
				rotation.z={-0.78}
				scale.y={unit.health}
				position={[unit.currentPosition.x, 0.6, unit.currentPosition.z]}
				color={unit.health > 0.5 ? 'green' : 'red'}
			/>
		{/if}
	{/each}
	<T.PlaneGeometry args={[0.06, 0.4]} />
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
