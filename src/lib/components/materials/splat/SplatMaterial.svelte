<script lang="ts">
	import { T, useLoader } from '@threlte/core';
	import { SRGBColorSpace, ShaderMaterial, TextureLoader, RepeatWrapping } from 'three';
	import fragmentShader from './splat-fragment.glsl?raw';
	import vertexShader from './splat-vertex.glsl?raw';

	export let images = {};
	export let colors = [
		[1, 0, 0],
		[0, 0, 1],
		[0, 1, 0]
	];
	export let blendImage: any;
	export let repeat = 1;
	export let useNoise = false;
	export let noiseOffset = 0;

	let useColors = Object.keys(images).length === 0 ? 1 : 0;

	const { load } = useLoader(TextureLoader);

	const textures = load(images, {
		transform: (texture) => {
			texture.wrapS = RepeatWrapping;
			texture.wrapT = RepeatWrapping;
			texture.colorSpace = SRGBColorSpace;
			return texture;
		}
	});

	const texturesLoaded = (t: any) => {
		if (!t) return;
		sm.uniforms.textures.value = [t.image1, t.image2, t.image3];
	};

	$: texturesLoaded($textures);

	const sm = new ShaderMaterial({
		uniforms: {
			colors: {
				value: [
					colors[0][0],
					colors[0][1],
					colors[0][2],
					colors[1][0],
					colors[1][1],
					colors[1][2],
					colors[2][0],
					colors[2][1],
					colors[2][2]
				]
			},
			textures: { value: [0, 0, 0] },
			blendTexture: { value: blendImage },
			noiseOffset: { value: noiseOffset },
			useNoise: { value: useNoise ? 1 : 0 },
			repeat: { value: repeat },
			useColors: { value: useColors }
		},
		fragmentShader,
		vertexShader
	});

	$: sm.uniforms.noiseOffset.value = noiseOffset;
</script>

<T is={sm} transparent />
