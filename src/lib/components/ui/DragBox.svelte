<script lang="ts">
	import { dragBox } from '$lib/stores';

	let dragging = false;
	let left = 0;
	let top = 0;
	let width = 0;
	let height = 0;

	const dragStateChanged = (db: any) => {
		if (!db) return;
		if (!db.mouseDown) {
			$dragBox.x = 0;
			$dragBox.moveX = 0;
			$dragBox.y = 0;
			$dragBox.moveY = 0;
			width = 0;
			height = 0;
			dragging = false;
		} else {
			if (db.moveX === 0 || db.moveY === 0) return;
			dragging = true;
			if (db.moveX > db.x) {
				left = db.x;
				width = db.moveX - db.x;
			} else {
				left = db.moveX;
				width = db.x - db.moveX;
			}
			if (db.moveY > db.y) {
				top = db.y;
				height = db.moveY - db.y;
			} else {
				top = db.moveY;
				height = db.y - db.moveY;
			}
		}
	};

	$: dragStateChanged($dragBox);
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
