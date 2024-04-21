<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { units, cameraPosition, cameraGroundPosition } from '$lib/stores';
	import { rotatePoint } from '$lib/utils';
	import { onDestroy, onMount } from 'svelte';
	import { CanvasTexture } from 'three';
	import { interval } from '$lib/animation';
	import SplatMaterial from './materials/splat/SplatMaterial.svelte';

	let miniMapCanvas: HTMLCanvasElement;
	let miniMapCanvasContext: CanvasRenderingContext2D | null;
	let cameraCanvas: HTMLCanvasElement;
	let cameraCanvasContext: CanvasRenderingContext2D | null;
	let unitsCanvas: HTMLCanvasElement;
	let unitsCanvasContext: CanvasRenderingContext2D | null;
	let miniMapContainer: HTMLElement | null;
	let canvasTexture: any;
	let fogCanvas: HTMLCanvasElement;
	let fogCanvasContext: CanvasRenderingContext2D | null;
	let brush: HTMLImageElement;
	let brushSize = 50;
	let time = 0;

	const updateUnitsCanvas = (u: any[]) => {
		if (!unitsCanvas) return;
		if (!unitsCanvasContext) return;
		unitsCanvasContext.clearRect(0, 0, 200, 200);
		if (!fogCanvasContext) return;
		fogCanvasContext.fillStyle = '#ff0000';
		fogCanvasContext.fillRect(0, 0, 128, 128);
		u.forEach((unit, i) => {
			if (!unitsCanvasContext) return;
			unitsCanvasContext.fillStyle = '#F85122';
			unitsCanvasContext.fillRect(
				((unit.currentPosition.x + 25) / 50) * 200,
				((unit.currentPosition.z + 25) / 50) * 200,
				3,
				3
			);
			if (!fogCanvasContext || unit.factionId !== 0) return;
			fogCanvasContext.drawImage(
				brush,
				((unit.currentPosition.x + 25) / 50) * 128 - brushSize / 2,
				((unit.currentPosition.z + 25) / 50) * 128 - brushSize / 2,
				brushSize,
				brushSize
			);
		});
		canvasTexture.needsUpdate = true;
	};

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

	function loadBrushImage(src: string) {
		return new Promise<HTMLImageElement>((resolve, reject) => {
			let img = new Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = src;
		});
	}

	const everySecond = interval(0.5);

	useTask((delta) => {
		everySecond(delta, () => {
			updateUnitsCanvas($units);
		});

		if (!miniMapCanvasContext) return;
		miniMapCanvasContext.fillStyle = '#000000';
		miniMapCanvasContext.fillRect(0, 0, 200, 200);
		miniMapCanvasContext?.drawImage(unitsCanvas, 0, 0);
		miniMapCanvasContext?.drawImage(cameraCanvas, 0, 0);

		time += delta / 10;
	});

	onMount(() => {
		unitsCanvas = document.createElement('canvas');
		unitsCanvas.height = 200;
		unitsCanvas.width = 200;
		unitsCanvasContext = unitsCanvas.getContext('2d');
		cameraCanvas = document.createElement('canvas');
		cameraCanvas.height = 200;
		cameraCanvas.width = 200;
		cameraCanvasContext = cameraCanvas.getContext('2d');
		miniMapCanvas = document.createElement('canvas');
		miniMapCanvas.height = 300;
		miniMapCanvas.width = 300;
		miniMapCanvasContext = miniMapCanvas.getContext('2d');
		if (!miniMapCanvasContext) return;
		miniMapCanvasContext.translate(150, 0);
		miniMapCanvasContext.rotate((45 * Math.PI) / 180);
		miniMapCanvasContext.fillStyle = '#000000';
		miniMapCanvasContext.fillRect(0, 0, 200, 200);
		miniMapContainer = document.getElementById('miniMapContainer');
		if (miniMapContainer) {
			miniMapCanvas.addEventListener('click', canvasClicked);
			miniMapContainer.appendChild(miniMapCanvas);
		}

		fogCanvas = document.createElement('canvas');
		fogCanvas.height = 128;
		fogCanvas.width = 128;
		fogCanvasContext = fogCanvas.getContext('2d');
		if (!fogCanvasContext) return;
		fogCanvasContext.fillStyle = '#FF0000';
		fogCanvasContext.fillRect(0, 0, 200, 200);
		loadBrushImage('blackCircle.png').then((img) => {
			brush = img;
			//updateFogCanvas($units);
		});
		canvasTexture = new CanvasTexture(fogCanvas);

		//window.requestAnimationFrame(step);
	});

	onDestroy(() => {
		miniMapContainer?.removeChild(miniMapCanvas);
	});
</script>

<T.Mesh name="fog" rotation.x={-1.57} scale={[50, 50]} position={[2, 3, 2]}>
	<T.PlaneGeometry />

	<SplatMaterial
		colors={[
			[0, 0, 0],
			[0, 0, 0],
			[0, 0, 0]
		]}
		repeat={15}
		blendImage={canvasTexture}
		useNoise
		noiseOffset={time}
		opacity={0.6}
	/>

	<!-- <T.MeshBasicMaterial /> -->
</T.Mesh>
