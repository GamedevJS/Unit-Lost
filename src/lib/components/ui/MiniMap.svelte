<script lang="ts">
	import { units, cameraPosition, cameraGroundPosition } from '$lib/stores';
	import { rotatePoint } from '$lib/utils';
	import { onMount } from 'svelte';

	let miniMapCanvas: HTMLCanvasElement;
	let miniMapCanvasContext: CanvasRenderingContext2D | null;
	let cameraCanvas: HTMLCanvasElement;
	let cameraCanvasContext: CanvasRenderingContext2D | null;
	let unitsCanvas: HTMLCanvasElement;
	let unitsCanvasContext: CanvasRenderingContext2D | null;
	let loaded = false;

	const miniMapCanvasLoaded = (c: HTMLCanvasElement) => {
		if (!c || loaded) return;
		miniMapCanvasContext = c.getContext('2d');
		loaded = true;

		if (!miniMapCanvasContext) return;
		miniMapCanvasContext.translate(150, 0);
		miniMapCanvasContext.rotate((45 * Math.PI) / 180);
		miniMapCanvasContext.fillStyle = '#000000';
		miniMapCanvasContext.fillRect(0, 0, 200, 200);
	};

	$: miniMapCanvasLoaded(miniMapCanvas);

	const updateUnitsCanvas = (u: any[]) => {
		//console.log('!');
		if (!unitsCanvas) return;
		if (!unitsCanvasContext) return;
		unitsCanvasContext.clearRect(0, 0, 200, 200);
		u.forEach((unit, i) => {
			if (!unitsCanvasContext) return;
			unitsCanvasContext.fillStyle = '#F85122';
			unitsCanvasContext.fillRect(
				((unit.currentPosition.x + 25) / 50) * 200,
				((unit.currentPosition.z + 25) / 50) * 200,
				3,
				3
			);
		});
	};

	//$: updateCanvas($units);

	const cameraUpdated = (cp: any) => {
		if (!cameraCanvasContext) return;
		const camPoint = { x: ((cp.x + 25) / 50) * 200, y: ((cp.z + 25) / 50) * 200 };
		cameraCanvasContext.clearRect(0, 0, 200, 200);
		cameraCanvasContext.strokeStyle = '#FFFFFF';
		cameraCanvasContext.beginPath();
		cameraCanvasContext.moveTo(camPoint.x - 30, camPoint.y + 5);
		cameraCanvasContext.lineTo(camPoint.x + 5, camPoint.y - 30);
		cameraCanvasContext.lineTo(camPoint.x + 20, camPoint.y);
		cameraCanvasContext.lineTo(camPoint.x, camPoint.y + 20);
		cameraCanvasContext.lineTo(camPoint.x - 30, camPoint.y + 5);
		cameraCanvasContext.closePath();
		cameraCanvasContext.lineWidth = 2;
		cameraCanvasContext.stroke();
	};

	$: cameraUpdated($cameraGroundPosition);

	const canvasClicked = (e: MouseEvent) => {
		let worldPoint = {
			x: (e.offsetX / 200) * 50 - 5,
			y: (e.offsetY / 200) * 50 - 5
		};
		let rotated = rotatePoint(worldPoint.x - 32, worldPoint.y - 2);

		$cameraPosition = { x: rotated.x, z: rotated.y, setByMap: true };
	};

	let lastTime = 0;
	let elapsed = 0;
	let clock = 0;
	let delta = 0;
	let frameCounter = 1;
	let requiredElapsed = 1000 / 2; // 2 fps
	const step = (now: number) => {
		if (!lastTime) {
			lastTime = now;
		}
		let elapsed = now - lastTime;

		if (elapsed > requiredElapsed) {
			lastTime = now;
			updateUnitsCanvas($units);
		}

		if (!miniMapCanvasContext) return;
		miniMapCanvasContext.fillStyle = '#000000';
		miniMapCanvasContext.fillRect(0, 0, 200, 200);
		miniMapCanvasContext?.drawImage(unitsCanvas, 0, 0);
		miniMapCanvasContext?.drawImage(cameraCanvas, 0, 0);
		window.requestAnimationFrame(step);
	};

	onMount(() => {
		unitsCanvas = document.createElement('canvas');
		unitsCanvas.height = 200;
		unitsCanvas.width = 200;
		unitsCanvasContext = unitsCanvas.getContext('2d');
		cameraCanvas = document.createElement('canvas');
		cameraCanvas.height = 200;
		cameraCanvas.width = 200;
		cameraCanvasContext = cameraCanvas.getContext('2d');

		window.requestAnimationFrame(step);
	});
</script>

<canvas
	bind:this={miniMapCanvas}
	height="300px"
	width="300px"
	style:position="absolute"
	style:bottom="20px"
	style:right="20px"
	on:mouseup={canvasClicked}
/>
