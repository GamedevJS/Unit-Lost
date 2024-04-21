import { writable, derived, type Writable, type Readable } from 'svelte/store';
import type { Unit } from '$lib/types';

export const game = writable({
	dev: false,
	useEdgeCamera: false
});

export const cameraPosition = writable({
	x: 10,
	z: 10,
	setByMap: false
});

export const cameraGroundPosition = derived(cameraPosition, (cp) => ({
	x: cp.x - 20,
	z: cp.z - 20
}));

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
export const selectedUnits: Writable<{ units: string | string[]; mouseBtn: number }> = writable({
	units: '',
	mouseBtn: 0
});
