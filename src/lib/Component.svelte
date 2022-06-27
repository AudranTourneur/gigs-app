<script>
	import { createEventDispatcher } from 'svelte';

	export let item;
	export let index;

	const dispatch = createEventDispatcher();
</script>

<h1>
	<span>{index + 1}</span>
	{item.name}
	<button class="btn btn-error" on:click={() => dispatch('delete')}>Delete</button>
</h1>

<style>
	span {
		background-color: #ddd;
		border-radius: 4px;
		padding: 0 1em;
		font-size: 0.5em;
	}
</style>
