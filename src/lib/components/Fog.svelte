<script lang="ts">
	import { T } from '@threlte/core';
	import { onDestroy, onMount } from 'svelte';
	import { CanvasTexture, MeshBasicMaterial } from 'three';
	import { units } from '$lib/stores';
	import SplatMaterial from './materials/splat/SplatMaterial.svelte';
	import { useTexture } from '@threlte/extras';
	import type { Unit } from '$lib/types';

	let fogCanvas: HTMLCanvasElement;
	let fogCanvasContext: CanvasRenderingContext2D | null;
	let brush: HTMLImageElement;
	let brushSize = 50;
	let canvasTexture: any;

	const blendImage = useTexture('test.png');

	const updateFogCanvas = (u: Unit[]) => {
		if (!fogCanvasContext) return;
		fogCanvasContext.fillStyle = '#ff0000';
		fogCanvasContext.fillRect(0, 0, 128, 128);
		let x = 64;
		let y = 64;
		u.forEach((unit, i) => {
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
		console.log(canvasTexture);
	};

	$: updateFogCanvas($units);

	function loadBrushImage(src: string) {
		return new Promise<HTMLImageElement>((resolve, reject) => {
			let img = new Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = src;
		});
	}

	onMount(() => {
		fogCanvas = document.createElement('canvas');
		fogCanvas.height = 128;
		fogCanvas.width = 128;
		fogCanvasContext = fogCanvas.getContext('2d');
		//document.body.appendChild(fogCanvas);
		loadBrushImage('blackCircle.png').then((img) => {
			brush = img;
			updateFogCanvas($units);
		});
		canvasTexture = new CanvasTexture(fogCanvas);
	});

	onDestroy(() => {
		//document.body.removeChild(fogCanvas);
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
	/>

	<!-- <T.MeshBasicMaterial /> -->
</T.Mesh>
