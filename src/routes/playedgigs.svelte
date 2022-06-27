<script context="module">
	export async function load({ fetch }) {
		const playedgigsRes = await fetch(`/db/playedgigs`);
		const playedgigs = await playedgigsRes.json();

		const gigsRes = await fetch(`/db/gigs`);
		const gigs = await gigsRes.json();

		const songsRes = await fetch(`/db/songs`);
		const songs = await songsRes.json();

		return {
			props: {
				playedgigs,
				gigs,
				songs
			}
		};
	}
</script>

<script>
	import { DateInput } from 'date-picker-svelte';
	import { groupBy } from 'lodash';
	import { orderBy } from 'lodash-es';
	import { cloneDeep } from 'lodash-es';
	import { onMount } from 'svelte';

	export let playedgigs;
	export let gigs;
	export let songs;

	let songsMap = {};
	for (const song of songs) {
		songsMap[song.id] = song;
	}

	let gigsMap = {};
	for (const gig of gigs) {
		gigsMap[gig.id] = gig;
	}

	for (const pg of playedgigs) {
		//pg.set_list = pg.set_list.map((x) => x.name).join('<br>');
		//console.log('SET LIST', pg.set_list);
		//console.log(pg);
		pg.location = gigsMap[pg.gig_id].venue;
		pg.date_played = new Date(pg.date_played).toLocaleDateString('en-UK');
	}

	let songsAvailable = cloneDeep(songs);

	let gigLocation;
	let date = new Date();
	let fee = 0;
	let diesel = 0;
	let otherInformation = '';

	let selectedAddToSetListSongId;
	let isDefaultKey = true;
	let selectedKey = '';
	let selectedOther = '';
	let setNumber = 1;
	let setList = [];

	function addToSetList() {
		setList = [
			...setList,
			{
				id: selectedAddToSetListSongId,
				music_key: isDefaultKey ? null : selectedKey,
				other_information: selectedOther,
				set_number: setNumber,
				internal_set_number: getNextInternalSetNumberInSet(setList, setNumber)
			}
		];
		songsAvailable = songsAvailable.filter((x) => x.id != selectedAddToSetListSongId);
		selectedAddToSetListSongId = songsAvailable[0].id;

		selectedKey = '';
		selectedOther = '';

		updateKeyInfo();
	}

	let isSubmitting = false;

	async function submit() {
		isSubmitting = true;

		await fetch('/db/playedgigs', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				location: gigLocation,
				date: date.toISOString().split('T')[0],
				fee,
				diesel,
				setList,
				otherInformation
			})
		});

		setTimeout(() => {
			location.reload();
		}, 500);
	}

	function getNextInternalSetNumberInSet(setList, setNumber) {
		const groups = groupBy(setList, 'set_number');
		console.log('here', groups[setNumber]);
		if (!groups[setNumber]) return 0;
		else {
			return Math.max(...groups[setNumber].map((x) => x.internal_set_number)) + 1;
		}
	}

	function updateKeyInfo() {
		if (songsMap[selectedAddToSetListSongId])
			selectedKey = songsMap[selectedAddToSetListSongId].music_key;
	}

	onMount(() => {
		updateKeyInfo();
	});

	let displayFields = ['Location', 'Date played', 'Fee', 'Diesel', 'Other information'];

	let objectFields = ['location', 'date_played', 'fee', 'diesel', 'other_information'];

	let data = playedgigs;
	let openModalPrint = false;
	let selectedPlayedGigId = null;

	function print(obj) {
		selectedPlayedGigId = obj.id;

		openModalPrint = true;
		//location.href = `/playedgigs/${obj.id}.pdf`;
	}

	function edit(obj) {
		location.href = `/playedgigs/edit/${obj.id}`;
	}

	onMount(() => {
		document.addEventListener('keypress', (e) => {
			//console.log(e.key, e.ctrlKey);
			if (e.key == 'Enter' && e.ctrlKey) {
				addToSetList();
			}
		});
	});

	let fontSize = 20;
</script>

<h1>Played gigs</h1>

<!--
<DataTable
	displayFields={[
		'Location',
		'Date played',
		'Fee',
		'Diesel',
		'Contact sent',
		'Other information',
		'Set list'
	]}
	objectFields={[
		'location',
		'date_played',
		'fee',
		'diesel',
		'contact_sent',
		'other_information',
		'set_list'
	]}
	data={playedgigs}
/>
-->

<div class="relative overflow-x-auto shadow-md sm:rounded-lg mx-10">
	<table class="w-full text-lg text-left">
		<thead class="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
			<tr>
				{#each displayFields as field}
					<th scope="col" class="py-3">{field}</th>
				{/each}
				<th scope="col" class="py-3">Set list</th>
				<th scope="col" class="py-3">Actions</th>
			</tr>
		</thead>
		<tbody class="text-base-content">
			{#each data as obj}
				<tr class="border-b">
					{#each objectFields as field}
						<td class="py-4">{@html obj[field] ?? ''}</td>
					{/each}
					<td class="py-4">
						{#each Object.values(groupBy(obj.set_list, 'set_number')) as list}
							<h2 class="text-lg font-bold">Set {list[0].set_number}</h2>
							<ul class="list-disc ml-5">
								{#each orderBy(list, 'internal_set_number') as song}
									<li>
										{songsMap[song.id].name}
										{#if songsMap[song.id]?.music_key && !song.music_key}
											<span class="text-gray-500">
												[{songsMap[song.id].music_key}]
											</span>
										{/if}
										{#if song.music_key || song.other_information}
											<span class="text-gray-500">
												[
												{#if song.music_key}
													Key: {song.music_key}
												{/if}

												{#if song.music_key && song.other_information}
													|
												{/if}

												{#if song.other_information}
													Other: {song.other_information}
												{/if}

												]
											</span>
										{/if}
									</li>
								{/each}
							</ul>
							<br />
						{/each}
					</td>
					<td class="py-4">
						<a href="/playedgigs/edit/{obj.id}">
							<button class="btn btn-outline btn-info">Edit</button>
						</a>
						<button class="btn btn-outline btn-secondary" on:click={() => print(obj)}>Print</button>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<br />
<br />
<hr />
<br />
<br />

<div class="w-1/3 m-10 bg-base-200 border rounded-lg p-10">
	<h1>Add a new entry</h1>
	<br />
	<div class="mb-6">
		<label for="gig_location" class="block mb-2 text-sm font-medium">Location</label>

		<select class="select select-bordered w-full max-w-xs" bind:value={gigLocation}>
			{#each orderBy(gigs, 'venue') as gig}
				<option value={gig.id}>{gig.venue}</option>
			{/each}
		</select>

		<br />
		<br />

		<label for="base-input" class="block mb-2 text-sm font-medium"> Date played </label>

		<DateInput bind:value={date} format="dd/MM/yyyy" min={new Date(`${new Date().getFullYear()-35}-01-01`)} max={new Date(`${new Date().getFullYear()+5}-12-31`)} />

		<br />

		<label for="fee" class="block mb-2 text-sm font-medium">Fee</label>

		<input
			id="fee"
			name="fee"
			type="text"
			placeholder="Fee"
			class="input input-bordered w-full max-w-xs"
			bind:value={fee}
		/>

		<br />
		<br />

		<label for="diesel" class="block mb-2 text-sm font-medium">Diesel</label>

		<input
			id="diesel"
			name="diesel"
			type="text"
			placeholder="Diesel"
			class="input input-bordered w-full max-w-xs"
			bind:value={diesel}
		/>

		<br />
		<br />

		<label for="other_information" class="block mb-2 text-sm font-medium">Other information</label>

		<input
			id="other_information"
			name="other_information"
			type="text"
			placeholder="Other information"
			class="input input-bordered w-full max-w-xs"
			bind:value={otherInformation}
		/>

		<br />
		<br />

		<div class="bg-base-300 p-4 border rounded-lg">
			<span class="block mb-2 text-md font-medium">
				Set list ({setList.length} songs)
			</span>

			{#each Object.values(groupBy(setList, 'set_number')) as list}
				<h2 class="text-lg font-bold">Set {list[0].set_number}</h2>
				<ul class="list-disc ml-5">
					{#each orderBy(list, 'internal_set_number') as song}
						<li>
							{songsMap[song.id].name}
							{#if song.music_key || song.other_information}
								<span class="text-gray-500">
									[
									{#if song.music_key}
										Key: {song.music_key}
									{/if}

									{#if song.music_key && song.other_information}
										|
									{/if}

									{#if song.other_information}
										Other: {song.other_information}
									{/if}

									]
								</span>
							{/if}
						</li>
					{/each}
				</ul>
				<br />
			{/each}
			<br />

			<label for="set_number" class="block mb-2 text-sm font-medium">Set number</label>
			<input
				type="number"
				name="set_number"
				id="set_number"
				class="input input-bordered w-full max-w-xs"
				bind:value={setNumber}
			/>
			<br />
			<br />

			<label for="set_list" class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400"
				>Add song to set list</label
			>
			<select
				id="set_list"
				class=" select select-bordered w-full max-w-xs"
				bind:value={selectedAddToSetListSongId}
				on:change={updateKeyInfo}
			>
				{#each orderBy(songsAvailable, 'name') as song}
					<option value={song.id}>{song.name}</option>
				{/each}
			</select>

			<br />
			<br />

			<div class="form-control w-full max-w-xs">
				<label class="label cursor-pointer">
					<span class="label-text">Default key</span>
					<input type="checkbox" bind:checked={isDefaultKey} class="checkbox checkbox-primary" />
				</label>
			</div>

			{#if !isDefaultKey}
				<label for="song_key" class="block mb-2 text-sm font-medium">Key</label>
				<input
					id="song_key"
					type="text"
					class="input input-bordered w-full max-w-xs"
					bind:value={selectedKey}
				/>
			{/if}

			<br />
			<br />

			<label for="song_other" class="block mb-2 text-sm font-medium">Other</label>
			<input
				id="song_other"
				type="text"
				class="input input-bordered w-full max-w-xs"
				bind:value={selectedOther}
			/>
			<br />
			<br />
			<div class="w-full flex flex-row-reverse">
				<button class="btn btn-secondary" on:click={addToSetList}>Add</button>
			</div>
		</div>
		<br />
		<br />

		<div class="w-full flex flex-row-reverse">
			<button class="btn btn-primary" on:click={submit} class:loading={isSubmitting}>Submit</button>
		</div>
	</div>
</div>

<!-- Put this part before </body> tag -->
<input type="checkbox" id="modal-insert" class="modal-toggle" checked={openModalPrint} />
<div class="modal modal-bottom sm:modal-middle">
	<div class="modal-box">
		<h3 class="font-bold text-lg">Print</h3>

		<label for="font_size">Font size: {fontSize}</label>
		<input
			id="font_size"
			type="range"
			min="5"
			max="50"
			class="range range-secondary"
			bind:value={fontSize}
		/>

		<br />
		<br />

		<div class="modal-action">
			<button class="btn" on:click={() => (openModalPrint = false)}>Cancel</button>
			<a href="/playedgigs/{selectedPlayedGigId}-{fontSize}.pdf">
				<button class="btn btn-secondary">Print</button>
			</a>
		</div>
	</div>
</div>
