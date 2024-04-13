import { writable, type Writable } from 'svelte/store';
import type { Unit } from '$lib/types';

export const dragBox = writable({
	x: 0,
	y: 0,
	moveX: 0,
	moveY: 0,
	mouseDown: false
});

export const units: Writable<Unit[]> = writable([]);
export const selectedUnit: Writable<number | number[]> = writable(0);
