<script context="module">
	export async function load({ fetch }) {
		const songsRes = await fetch(`/db/songs`);
		const songs = await songsRes.json();

		const gigsRes = await fetch(`/db/gigs`);
		const gigs = await gigsRes.json();

		return {
			props: {
				songs,
				gigs
			}
		};
	}
</script>

<script>
	import DataTable from '$lib/DataTable.svelte';

	export let songs;
	export let gigs;
</script>

<h1>Songs</h1>

<DataTable
	displayFields={[
		'ID',
		'Name',
		'Key',
		'Genre',
		'Tempo',
		'Steve guitare',
		'Lynn guitare',
		'Steve vocal',
		'Lynn vocal',
		'Percussion'
	]}
	objectFields={[
		'id',
		'name',
		'music_key',
		'genre',
		'tempo',
		'steve_gtr',
		'lynn_gtr',
		'steve_vox',
		'lynn_vox',
		'percussion'
	]}
	data={songs}
/>
