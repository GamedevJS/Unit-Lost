<script lang="ts">
	import App from '$lib/components/App.svelte';
</script>

<div>
	<App />
</div>

<style>
	:global(body),
	:global(button) {
		margin: 0;
		font-family: 'Plus Jakarta Sans', sans-serif;
		font-optical-sizing: auto;
		font-weight: 700;
		font-style: normal;
	}

	div {
		width: 100vw;
		height: 100vh;
		background: rgb(0, 0, 0);
	}
</style>
