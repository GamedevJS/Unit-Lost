<script lang="ts">
	import { units } from '$lib/stores';
	let canvas: HTMLCanvasElement;
	let canvasContext: CanvasRenderingContext2D | null;
	let loaded = false;

	const canvasLoaded = (c: HTMLCanvasElement) => {
		if (!c || loaded) return;
		canvasContext = c.getContext('2d');
		loaded = true;

		if (!canvasContext) return;
		canvasContext.fillStyle = '#000000';
		canvasContext.fillRect(0, 0, 200, 200);
	};

	$: canvasLoaded(canvas);

	const updateCanvas = (u: any[]) => {
		console.log('!');
		if (!canvas) return;
		if (!canvasContext) return;
		canvasContext.fillStyle = '#000000';
		canvasContext.fillRect(0, 0, 200, 200);
		u.forEach((unit, i) => {
			if (!canvasContext) return;
			canvasContext.fillStyle = '#F85122';
			canvasContext.fillRect(
				((unit.currentPosition.x + 10) / 20) * 200,
				((unit.currentPosition.z + 10) / 20) * 200,
				4,
				4
			);
		});
	};

	$: updateCanvas($units);
</script>

<canvas
	bind:this={canvas}
	height="200px"
	width="200px"
	style:position="absolute"
	style:bottom="20px"
	style:right="20px"
/>
