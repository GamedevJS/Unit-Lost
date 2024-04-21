import type { Point, Unit } from './types';

export const generateId = () => {
	return Math.random().toString(16).slice(2);
};

export const generateGrid = (unitCount = 5, center = { x: -2, y: 4 }) => {
	const sq = Math.ceil(Math.sqrt(unitCount));
	const cellSpacing = 0.5;
	const gridCells = [];
	const columns = sq;
	const rows = sq;
	const totalWidth = columns * cellSpacing; // 5 * 0.06 = 0.3
	const totalHeight = rows * cellSpacing;
	let topEdge = center.y - totalHeight / 4;
	for (let r = 1; r <= rows; r++) {
		let leftEdge = center.x - totalWidth / 4;
		for (let c = 1; c <= columns; c++) {
			let cell = {
				x: leftEdge,
				y: topEdge
			};
			leftEdge += cellSpacing;
			gridCells.push(cell);
		}
		topEdge += cellSpacing;
	}
	return gridCells;
};

export const rotatePoint = (x: number, y: number, cx = 0, cy = 0, angle = 45) => {
	var radians = (Math.PI / 180) * angle,
		cos = Math.cos(radians),
		sin = Math.sin(radians),
		nx = cos * (x - cx) + sin * (y - cy) + cx,
		ny = cos * (y - cy) - sin * (x - cx) + cy;
	return { x: nx, y: ny };
};

/**
 * Returns true if 2D point is insde an array of 2D points.
 * The order of the points matter!
 */
export function isPointInside(point: Point, points: Point[]): boolean {
	const x = point.x;
	const y = point.z;
	let inside = false;
	for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
		const xi = points[i].x;
		const yi = points[i].z;
		const xj = points[j].x;
		const yj = points[j].z;
		const intersect = yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
		if (intersect) inside = !inside;
	}
	return inside;
}

/**
 * Returns the closet 2D position for a given 2D point from an array of 2D positions.
 */
export function findClosestUnit(point: Point, units: Unit[]): Unit | undefined {
	let closestUnit;
	let minDistance = Infinity;
	for (let i = 0; i < units.length; i++) {
		const distance = calculateDistanceBetweenPoints(point, units[i].currentPosition);
		if (distance < minDistance) {
			closestUnit = units[i];
			minDistance = distance;
		}
	}
	return closestUnit;
}
export function calculateDistanceBetweenPoints(pointA: Point, pointB: Point): number {
	const dx = pointA.x - pointB.x;
	const dz = pointA.z - pointB.z;
	return Math.sqrt(dx * dx + dz * dz);
}
