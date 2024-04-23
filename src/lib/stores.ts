import { writable, derived, type Writable, type Readable } from 'svelte/store';
import type { Unit, SelectedUnits } from '$lib/types';

export const game = writable({
	dev: false,
	useEdgeCamera: false,
	placingBuilding: false,
	credits: 50,
	supply: 3,
	unitCount: 0
});

export const gameTime = writable(0);

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

export const cursorGroundPosition = writable({
	x: 0,
	z: 0
});

export const dragBox = writable({
	x: 0,
	y: 0,
	mouseDown: false
});

export const units: Writable<Unit[]> = writable([]);
export const selectedUnits: Writable<SelectedUnits> = writable({
	units: [],
	mouseBtn: 0
});
