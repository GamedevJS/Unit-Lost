<script lang="ts">
	import { units, cameraPosition } from '$lib/stores';
	let canvas: HTMLCanvasElement;
	let canvasContext: CanvasRenderingContext2D | null;
	let loaded = false;

	const canvasLoaded = (c: HTMLCanvasElement) => {
		if (!c || loaded) return;
		canvasContext = c.getContext('2d');
		loaded = true;

		if (!canvasContext) return;
		canvasContext.translate(150, 220);
		canvasContext.rotate((45 * Math.PI) / 180);
		canvasContext.translate(-150, -150);
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
				((unit.currentPosition.x + 25) / 50) * 200,
				((unit.currentPosition.z + 25) / 50) * 200,
				3,
				3
			);
		});
	};

	$: updateCanvas($units);

	const cameraUpdated = (cp: any) => {
		if (!canvasContext) return;
		canvasContext.fillStyle = '#000000';
		canvasContext.fillRect(0, 0, 200, 200);
		canvasContext.fillStyle = '#FFFFFF';
		canvasContext.fillRect(((cp.x + 25) / 50) * 200, ((cp.z + 25) / 50) * 200, 3, 3);
	};

	$: cameraUpdated($cameraPosition);

	const canvasClicked = (e: MouseEvent) => {
		console.log((e.offsetX / 300) * 50);
		$cameraPosition = { x: (e.offsetX / 300) * 50, z: (e.offsetY / 300) * 50, setByMap: true };
	};
</script>

<canvas
	bind:this={canvas}
	height="300px"
	width="300px"
	style:position="absolute"
	style:bottom="20px"
	style:right="20px"
	on:mouseup={canvasClicked}
/>
