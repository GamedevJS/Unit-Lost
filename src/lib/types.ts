import type { Vector3 } from 'three';

export type Unit = {
	id: number;
	factionId: number;
	targetId: number;
	selected: boolean;
	moveTo: Vector3;
	currentPosition: Vector3;
	state: 'idle' | 'moving' | 'attacking' | 'following';
	color: string;
	hold: boolean;
	health: number;
};
