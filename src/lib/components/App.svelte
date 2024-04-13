<script lang="ts">
	import { Canvas } from '@threlte/core';
	import { game } from '$lib/stores';
	import Scene from './Scene.svelte';
	import MiniMap from './ui/MiniMap.svelte';
	import DragBox from './ui/DragBox.svelte';
</script>

<DragBox />

<MiniMap />

<Canvas>
	<Scene />
</Canvas>

<svelte:window
	on:keypress={(e) => {
		if (e.key === 'd') {
			$game.dev = !$game.dev;
		}
	}}
/>
