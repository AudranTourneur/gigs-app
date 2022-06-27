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
import DataTable from "$lib/DataTable.svelte";


	export let songs;
	export let gigs;
</script>

<h1>Gigs</h1>

<DataTable
	displayFields={[
		'ID',
		'Venue',
		'Address',
		//'Postcode',
		//'Region',
		//'Email',
		//'Website',
		//'Organiser',
		//'Telephone',
		//'Guest night'
	]}
	objectFields={[
		'id',
		'venue',
		'address',
		//'postcode',
		//'region',
		//'email',
		//'website',
		//'organiser',
		//'telephone',
		//'guest_night'
	]}
	data={gigs}
/>