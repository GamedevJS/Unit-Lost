export const generateGrid = (unitCount = 5, center = { x: -2, y: 4 }) => {
	const gridCells = [];
	const columns = Math.ceil(unitCount / 4);
	const rows = Math.ceil(unitCount / 4);
	const cell_spacing = 0.6;
	const totalWidth = columns * cell_spacing; // 5 * 0.06 = 0.3
	const totalHeight = rows * cell_spacing;

	let topEdge = center.y - totalHeight / 2;
	for (let r = 0; r <= rows; r++) {
		let leftEdge = center.x - totalWidth / 2;
		for (let c = 0; c <= columns; c++) {
			let cell = {
				x: leftEdge,
				y: topEdge
			};
			leftEdge += cell_spacing;
			gridCells.push(cell);
		}
		topEdge += cell_spacing;
	}

	//console.log(gridCells);
	return gridCells;
};

//generateGrid();
