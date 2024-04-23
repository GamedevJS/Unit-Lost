<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { InstancedMesh, Instance, useInstancedSprite } from '@threlte/extras';
	import { cursorGroundPosition, game, selectedUnits, units } from '$lib/stores';
	import { Vector3, InstancedMesh as InstancedMeshType } from 'three';
	import { generateGrid, isPointInSquareRadius } from '$lib/utils';
	import type { Unit, SelectedUnits } from '$lib/types';

	export let moveTarget: Vector3;

	let arrayUpdated = false;
	let distance = 0;
	let unitsMesh: InstancedMeshType;
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

	const unitsSelected = (su: SelectedUnits) => {
		if (su === undefined) return;
		if (su.mouseBtn === 0) {
			$units.forEach((unit, index, array) => {
				unit.selected = false;
				if (!Array.isArray(su.units)) return;
				if (unit.factionId === 0 && su.units.find((u) => u.id === unit.id)) {
					unit.selected = true;
				}
			});
		} else {
			if (su.units.length < 1) return;
			let targetedEnemyId = '';
			$units.forEach((unit, index) => {
				if (unit.selected) {
					unit = setStateMoving(unit, su.units[0].id);
					targetedEnemyId = su.units[0].id;
				}
			});
			if (targetedEnemyId) {
				const targetedEnemy = $units.find((unit) => unit.id === targetedEnemyId);
				if (!targetedEnemy) return;
				attackPoint = targetedEnemy.currentPosition;
				attackPointOpacity = 1;
			}
		}
		$units = $units;
	};

	$: unitsSelected($selectedUnits);

	const moveUnits = (destination: Vector3) => {
		if (!destination) return;
		if ($game.placingBuilding) {
			placeBuilding();
			return;
		}
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
		if (unit.notYetPlaced) return closeEnemies;
		for (let i = 0; i < $units.length; i++) {
			let sibling = $units[i];
			if (sibling.factionId !== unit.factionId && !sibling.notYetPlaced) {
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

	const placeBuilding = () => {
		let buildingToPlace = $units.findIndex((u) => u.notYetPlaced);
		if (buildingToPlace > -1) {
			let buildingClash = false;
			$units.forEach((u) => {
				if (
					u.isBuilding &&
					!u.notYetPlaced &&
					isPointInSquareRadius(
						{
							x: $units[buildingToPlace].currentPosition.x,
							z: $units[buildingToPlace].currentPosition.z
						},
						{ x: u.currentPosition.x, z: u.currentPosition.z }
					)
				) {
					buildingClash = true;
				}
			});
			if (!buildingClash) {
				$units[buildingToPlace].notYetPlaced = false;
				$game.placingBuilding = false;
				updateBuildingPower();
				updateSupplyCount();
			}
		}
	};

	const updateBuildingPower = () => {
		let powerPlants = $units.filter((u) => u.typeId === 102 && u.health > 0);
		$units.forEach((u) => {
			if (u.isBuilding && u.typeId !== 102) {
				u.hasPower = false;
				powerPlants.forEach((p) => {
					if (
						isPointInSquareRadius(
							{ x: u.currentPosition.x, z: u.currentPosition.z },
							{ x: p.currentPosition.x, z: p.currentPosition.z },
							2
						)
					)
						u.hasPower = true;
				});
			}
		});
		$units = $units;
	};

	const updateSupplyCount = () => {
		$game.supply =
			$units.filter((u) => u.typeId === 103 && u.health > 0 && u.hasPower).length * 3 + 3;
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
		unit.targetId = targetId;
		return unit;
	};

	let foundEnemies: Unit[] = [];
	let allFoundEnemies: Unit[] = [];
	let savedFoundEnemies: Unit[] = [];
	let enemyInFiringRange: Unit | undefined;
	let target: Unit | undefined;
	let targetIndex: number | undefined;
	useTask((delta) => {
		savedFoundEnemies = allFoundEnemies;
		allFoundEnemies = [];
		$units.forEach((unit, index, object) => {
			unit.visible = false;
			if (savedFoundEnemies.find((u) => u.id === unit.id)) {
				unit.visible = true;
			}
			// is enemy nearby?
			foundEnemies = findCloseEnemies(unit);
			enemyInFiringRange = foundEnemies.find((u) => u.distance < 3);

			if (unit.health < 0.01) {
				arrayUpdated = true;
				$selectedUnits.units.forEach((u, i, o) => {
					if (u.health < 0) {
						o.splice(i, 1);
					}
				});
				$selectedUnits = $selectedUnits;
				if (unit.isBuilding) {
					updateBuildingPower();
					updateSupplyCount();
				} else if (unit.factionId === 0) {
					$game.unitCount--;
				}
				object.splice(index, 1);
			}

			if (unit.notYetPlaced) {
				arrayUpdated = true;
				unit.currentPosition.set(
					Math.round($cursorGroundPosition.x) + 0.5,
					0,
					Math.round($cursorGroundPosition.z) + 0.5
				);
			}

			if (unit.isBuilding) {
				if (unit.hasPower || unit.typeId === 102) {
					unit.color = 'white';
				} else {
					unit.color = 'grey';
				}

				return;
			}

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
	{#each $units as unit (unit.id)}
		{#if (unit.factionId === 0 || unit.visible) && !unit.isBuilding}
			<Instance
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
			scale={unit.selected ? (unit.isBuilding ? (unit.typeId === 101 ? 1.5 : 1.0) : 0.3) : 0}
			position={[unit.currentPosition.x, 0, unit.currentPosition.z]}
		/>
	{/each}
	<T.RingGeometry args={[0.9, 1, 24, 1]} />
	<T.MeshStandardMaterial />
</InstancedMesh>

<InstancedMesh name="health bars" frustumCulled={false}>
	{#each $units as unit, i (unit.id)}
		{#if (unit.factionId === 0 || unit.visible) && unit.health < unit.maxHealth}
			<Instance
				rotation.x={-1.57}
				rotation.z={-0.78}
				scale.y={unit.isBuilding
					? (unit.health / unit.maxHealth) * 2
					: unit.health / unit.maxHealth}
				position={[unit.currentPosition.x, unit.isBuilding ? 2.0 : 0.6, unit.currentPosition.z]}
				color={unit.health > 0.5 ? 'green' : 'red'}
			/>
		{/if}
	{/each}
	<T.PlaneGeometry args={[0.06, 0.4]} />
	<T.MeshStandardMaterial />
</InstancedMesh>

<InstancedMesh name="citidel" frustumCulled={false}>
	{#each $units as unit, i (unit.id)}
		{#if (unit.factionId === 0 || unit.visible) && unit.typeId === 101}
			<Instance
				position={[unit.currentPosition.x, 0.25, unit.currentPosition.z]}
				color={unit.color}
				scale={[2, 0.5, 2]}
			/>
		{/if}
	{/each}
	<T.BoxGeometry />
	<T.MeshStandardMaterial />
</InstancedMesh>

<InstancedMesh name="power station" frustumCulled={false}>
	{#each $units as unit, i (unit.id)}
		{#if (unit.factionId === 0 || unit.visible) && unit.typeId === 102}
			<Instance
				scale={[0.5, 1.5, 0.5]}
				position={[unit.currentPosition.x, 0.75, unit.currentPosition.z]}
				color={unit.color}
			/>
		{/if}
	{/each}
	<T.BoxGeometry />
	<T.MeshStandardMaterial />
</InstancedMesh>

<InstancedMesh name="supply depot" frustumCulled={false}>
	{#each $units as unit, i (unit.id)}
		{#if (unit.factionId === 0 || unit.visible) && unit.typeId === 103}
			<Instance
				position={[unit.currentPosition.x, 0.5, unit.currentPosition.z]}
				color={unit.color}
			/>
		{/if}
	{/each}
	<T.BoxGeometry />
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
