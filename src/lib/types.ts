import type { Vector3 } from 'three';

export type Unit = {
	id: string;
	factionId: number;
	targetId: string;
	selected: boolean;
	moveTo: Vector3;
	currentPosition: Vector3;
	state: 'idle' | 'moving' | 'attacking' | 'following';
	color: string;
	hold: boolean;
	health: number;
	visible: boolean;
	distance: number;
};
