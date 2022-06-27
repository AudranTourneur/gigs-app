<script>
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();
	const flipDurationMs = 200;

	export let items = [];
	export let type;
	export let songsMap;

	function handleSort(e) {
		console.log('consider', e);
		items = e.detail.items;
	}

	function handleSortFinal(e) {
		items = e.detail.items;
		console.log('finalized', e);
		for (const i of items) {
			console.log(i);
		}
		dispatch('finalize');
	}

	function insertAfter(x) {
		dispatch('insertAfter', x);
	}

	function del(x) {
		console.log('del', x);
		dispatch('deleteLine', x);
		//console.log('i', items.length)
		//items = items.filter(y => x.id != y.id)
		//console.log('i', items.length)
	}
</script>

<section
	use:dndzone={{ items, flipDurationMs, type }}
	on:consider={handleSort}
	on:finalize={handleSortFinal}
>
	{#each items as song (song.id)}
		<div
			class="w-full h-[3em] flex items-center border border-black border-1 justify-between"
			animate:flip={{ duration: flipDurationMs }}
		>
			<div>
				{song.internal_set_number + 1}
			</div>

			<div>
				{song.name}
				<span class="text-gray-500">
					[
					{#if song.music_key}
						Key: {song.music_key}
					{:else if songsMap[song.id]?.music_key}
						{songsMap[song.id].music_key}
					{/if}

					{#if song.other_information}
						(Other: {song.other_information})
					{/if}

					]
				</span>
			</div>

			<div>
				<button class="btn btn-link text-info" on:click={() => insertAfter(song)}
					>Insert after</button
				>
				<button class="btn btn-link text-error" on:click={() => del(song)}>Delete</button>
			</div>
		</div>
	{/each}
</section>

<style>
	div {
		text-align: center;
		margin: 0.2em;
		padding: 0.3em;
	}
	section {
		min-height: 12em;
	}
</style>
