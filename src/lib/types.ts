import type { Vector3 } from 'three';

export type Unit = {
	id: number;
	selected: boolean;
	moveTo: Vector3;
	currentPosition: Vector3;
	moving: boolean;
};
