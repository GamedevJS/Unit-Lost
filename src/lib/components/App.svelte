<script lang="ts">
	import { Canvas } from '@threlte/core';
	import Scene from './Scene.svelte';
	import RtsCanvas from './ui/MiniMap.svelte';
	import DragBox from './ui/DragBox.svelte';
</script>

<DragBox />

<RtsCanvas />

<Canvas>
	<Scene />
</Canvas>
