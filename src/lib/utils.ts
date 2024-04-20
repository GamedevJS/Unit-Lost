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
