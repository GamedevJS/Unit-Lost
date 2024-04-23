import type { Vector3 } from 'three';

export type Unit = {
	id: string;
	typeId: number;
	factionId: number;
	targetId: string;
	selected: boolean;
	moveTo: Vector3;
	currentPosition: Vector3;
	state: 'idle' | 'moving' | 'attacking' | 'following';
	color: string;
	hold: boolean;
	health: number;
	maxHealth: number;
	visible: boolean;
	distance: number;
	isBuilding: boolean;
};

export type SelectedUnits = { units: Unit[]; mouseBtn: number };

export type Point = { x: number; z: number };
