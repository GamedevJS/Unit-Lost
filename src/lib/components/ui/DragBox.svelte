<script lang="ts">
	import { cursorPosition, dragBox } from '$lib/stores';

	let dragging = false;
	let left = 0;
	let top = 0;
	let width = 0;
	let height = 0;

	const dragStateChanged = (db: any, cp: any) => {
		if (!db) return;
		if (!db.mouseDown) {
			$dragBox.x = 0;
			$dragBox.y = 0;
			width = 0;
			height = 0;
			dragging = false;
		} else {
			if (cp.x === 0 || cp.x === 0) return;
			dragging = true;
			if (cp.x > db.x) {
				left = db.x;
				width = cp.x - db.x;
			} else {
				left = cp.x;
				width = db.x - cp.x;
			}
			if (cp.y > db.y) {
				top = db.y;
				height = cp.y - db.y;
			} else {
				top = cp.y;
				height = db.y - cp.y;
			}
		}
	};

	$: dragStateChanged($dragBox, $cursorPosition);
</script>

<div
	id="dragBox"
	style:display={dragging ? 'block' : 'none'}
	style:left="{left}px"
	style:top="{top}px"
	style:width="{width}px"
	style:height="{height}px"
/>

<style>
	#dragBox {
		border: 1px solid #363636;
		position: absolute;
		top: 400px;
		left: 400px;
		background: rgb(0, 0, 0, 0.5);
		height: 100px;
		width: 100px;
	}
</style>
