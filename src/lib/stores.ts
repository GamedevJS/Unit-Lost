import { writable, type Writable } from 'svelte/store';
import type { Unit } from '$lib/types';

export const game = writable({
	dev: false
});

export const cameraPosition = writable({
	x: 0,
	z: 0,
	setByMap: false
});

export const cursorPosition = writable({
	x: 300,
	y: 300
});

export const dragBox = writable({
	x: 0,
	y: 0,
	mouseDown: false
});

export const units: Writable<Unit[]> = writable([]);
export const selectedUnit: Writable<number | number[]> = writable(-1);
