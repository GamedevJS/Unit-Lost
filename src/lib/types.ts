import type { Vector3, Quaternion, Euler } from 'three';

export type Unit = {
	id: string;
	typeId: number;
	factionId: number;
	targetId: string;
	selected: boolean;
	moveTo: Vector3;
	rotateDestination?: Quaternion;
	quaternion?: Quaternion;
	euler: Euler;
	currentPosition: Vector3;
	state: 'idle' | 'moving' | 'attacking' | 'following';
	color: string;
	hold: boolean;
	attackMove: boolean;
	health: number;
	maxHealth: number;
	visible: boolean;
	distance: number;
	isBuilding: boolean;
	hasPower?: boolean;
	notYetPlaced?: boolean;
};

export type SelectedUnits = { units: Unit[]; mouseBtn: number };

export type Point = { x: number; z: number };
