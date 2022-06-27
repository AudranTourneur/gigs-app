<script context="module">
	export async function load({ fetch, params }) {
		console.log(params);

		const url = `/playedgigs/api/${params.id}`;
		console.log('fetching', url);

		let res = await fetch(url);
		res = await res.json();

		const gigsRes = await fetch(`/db/gigs`);
		const gigs = await gigsRes.json();

		const songsRes = await fetch(`/db/songs`);
		const songs = await songsRes.json();

		return {
			props: {
				playedGig: res,
				gigs,
				songs
			}
		};
	}
</script>

<script>
	import { DateInput } from 'date-picker-svelte';
	import { orderBy } from 'lodash';
	import { cloneDeep } from 'lodash-es';

	import groupBy from 'lodash-es/groupBy';
	import SetList from '$lib/SetList.svelte';
	import { uniq } from 'lodash-es';

	export let playedGig;
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

	let gigLocation = playedGig.location;
	let date = new Date(playedGig.date_played);
	let fee = playedGig.fee;
	let diesel = playedGig.diesel;
	let otherInformation = playedGig.other_information;
	let setList = playedGig.set_list;
	let setNumbers = uniq(setList.map((x) => x.set_number)).sort();

	let isSubmitting = false;
	async function submit() {
		isSubmitting = true;
		let setListToSubmit = [];

		for (const [setId, set] of Object.entries(holderOfSets)) {
			for (const song of set) {
				setListToSubmit.push(song);
				console.log('ADD', setId, song);
			}
		}

		console.log('SUBMIT SETLIST', setListToSubmit);

		await fetch(`/playedgigs/api/${playedGig.id}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				id: playedGig.id,
				location: gigLocation,
				date: date.toISOString().split('T')[0],
				fee,
				diesel,
				setList: setListToSubmit,
				otherInformation
			})
		});

		setTimeout(() => {
			location.href = '/playedgigs';
		}, 500);
	}

	async function deleteEntry() {
		console.log('DELETE', playedGig.id);
		await fetch(`/playedgigs/api/${playedGig.id}`, {
			method: 'DELETE'
		});
		setTimeout(() => {
			location.href = '/playedgigs';
		});
	}

	let modalCreate = false;

	let modalInsert = false;
	let insertRef = null;

	function openInsertAfter(songOrNumber) {
		//if (typeof song == 'number') insertRef = null;
		//else insertRef = song;
		insertRef = songOrNumber;
		modalInsert = true;
	}

	function getNextInternalSetNumberInSet(setList, setNumber) {
		const groups = groupBy(setList, 'set_number');
		console.log('here', groups[setNumber]);
		if (!groups[setNumber]) return 0;
		else {
			let max = Math.max(...groups[setNumber].map((x) => x.internal_set_number)) + 1;
			for (let i = 0; i < max; i++) {
				if (!setList.find((x) => x.set_number == setNumber && x.internal_set_number == i)) {
					console.log('return pos', i);
					return i;
				}
			}
			console.log('return pos', max);
			return max;
		}
	}

	function confirmInsertAfter() {
		console.log('Inserting', songsMap[selectedAddToSetListSongId], 'after', insertRef);
		const setNum = typeof insertRef == 'number' ? insertRef : insertRef.set_number;
		const internalNum = typeof insertRef == 'number' ? -1 : insertRef.internal_set_number;
		const toUp = setList.filter(
			(x) => x.set_number == setNum && x.internal_set_number > internalNum
		);
		for (const s of toUp) {
			s.internal_set_number++;
		}
		let obj = {
			id: selectedAddToSetListSongId,
			name: songsMap[selectedAddToSetListSongId].name,
			music_key: isDefaultKey ? null : selectedKey,
			other_information: selectedOther,
			set_number: setNum,
			internal_set_number: getNextInternalSetNumberInSet(setList, setNum)
		};

		setList.push(obj);

		holderOfSets[setNum].splice(internalNum + 1, 0, obj);
		holderOfSets = holderOfSets;

		songsAvailable = songsAvailable.filter((x) => x.id != selectedAddToSetListSongId);

		setList = setList;

		modalInsert = false;
		insertRef = null;

		selectedAddToSetListSongId = songsAvailable[0].id;
	}

	let songsAvailable = cloneDeep(songs);

	function delSong(song) {
		console.log();
		setList = setList.filter((x) => x.id != song.id);
		songsAvailable.push(song);
		songsAvailable = orderBy(songsAvailable, 'name');
		songsAvailable = songsAvailable;
		console.log(songsAvailable);
		const songsAfter = setList.filter(
			(x) => x.set_number == song.set_number && x.internal_set_number > song.internal_set_number
		);

		for (const s of songsAfter) {
			s.internal_set_number--;
		}
		setList = setList;

		holderOfSets[song.set_number] = holderOfSets[song.set_number].filter((x) => x.id != song.id);
		holderOfSets = holderOfSets;

		selectedAddToSetListSongId = songsAvailable[0].id;
		//console.log('holderOfSets update', holderOfSets[song.set_number], holderOfSets, song);
	}

	for (const song of setList) {
		songsAvailable = songsAvailable.filter((x) => x.id != song.id);
	}

	let selectedAddToSetListSongId = songsAvailable[0].id;

	let selectedSetNumber = 1;
	let isDefaultKey = true;
	let selectedKey = '';
	let selectedOther = '';

	function updateKeyInfo() {
		if (songsMap[selectedAddToSetListSongId])
			selectedKey = songsMap[selectedAddToSetListSongId].music_key;
	}

	/*
	function deleteSet(x) {
		for (const song of setList) {
			if (song.set_number == x) {
				songsAvailable.push(song);
			}
		}

		songsAvailable = orderBy(songsAvailable, 'name');
		songsAvailable = songsAvailable;

		setList = setList.filter((song) => song.set_number != x);

		selectedAddToSetListSongId = songsAvailable[0].id;
	}
	*/

	function deleteSet(x) {
		if (!holderOfSets[x]) return;
		for (const song of holderOfSets[x]) {
			songsAvailable.push(song);
		}

		songsAvailable = orderBy(songsAvailable, 'name');

		delete holderOfSets[x];
		setNumbers = [...Object.keys(holderOfSets)]

		selectedAddToSetListSongId = songsAvailable[0].id;
	}

	function addNewSetOpen() {
		modalCreate = true;
	}

	function confirmCreateSet() {
		modalCreate = false;

		if (holderOfSets[selectedSetNumber]) return;

		holderOfSets[selectedSetNumber] = [{
			id: selectedAddToSetListSongId,
			name: songsMap[selectedAddToSetListSongId].name,
			music_key: isDefaultKey ? null : selectedKey,
			other_information: selectedOther,
			set_number: selectedSetNumber,
			internal_set_number: 0
		}];

		songsAvailable = songsAvailable.filter((x) => x.id != selectedAddToSetListSongId);

		setList = setList;

		setNumbers = [...Object.keys(holderOfSets)]

		selectedAddToSetListSongId = songsAvailable[0].id;
	}

	let holderOfSets = {};

	for (const [setId, set] of Object.entries(groupBy(setList, 'set_number'))) {
		holderOfSets[setId] = orderBy(set, 'internal_set_number');
	}

	function updateHolderOfSets() {
		console.log('updateSetListFromHolder');
		for (const [setId, set] of Object.entries(holderOfSets)) {
			let i = 0;
			for (const songObj of set) {
				songObj.set_number = setId;
				songObj.internal_set_number = i;
				i++;
			}
		}
	}
</script>

<div class="w-1/2 m-10 bg-base-200 border rounded-lg p-10">
	<h1>Edit entry (ID: {playedGig.id})</h1>
	<br />
	<div class="mb-6">
		<label for="gig_location" class="block mb-2 text-sm font-medium">Location</label>

		<select class="select select-bordered w-full max-w-xs" bind:value={gigLocation}>
			{#each gigs as gig}
				<option value={gig.id}>{gig.venue}</option>
			{/each}
		</select>

		<br />
		<br />

		<label for="base-input" class="block mb-2 text-sm font-medium"> Date played </label>

		<DateInput
			bind:value={date}
			format="dd/MM/yyyy"
			min={new Date(`${new Date().getFullYear() - 35}-01-01`)}
			max={new Date(`${new Date().getFullYear() + 5}-12-31`)}
		/>

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

			{#each setNumbers as setId}
				<h2 class="text-lg font-bold">
					Set {setId}
					<button class="btn btn-link text-info" on:click={() => openInsertAfter(setId)}
						>Insert after</button
					>
					<button class="btn text-error btn-link" on:click={() => deleteSet(setId)}
						>Delete whole set</button
					>
				</h2>

				<SetList
					bind:items={holderOfSets[setId]}
					{songsMap}
					on:deleteLine={(s) => delSong(s.detail)}
					on:insertAfter={(s) => openInsertAfter(s.detail)}
					on:finalize={() => updateHolderOfSets()}
				/>
				<br />
			{/each}
			<br />

			<button class="btn btn-link text-info" on:click={addNewSetOpen}>Add new set</button>
		</div>
	</div>

	<div class="w-full flex flex-row justify-evenly">
		<button class="btn btn-error" on:click={deleteEntry}>Delete entry</button>
		<button class="btn btn-primary" on:click={submit} class:loading={isSubmitting}
			>Save modifications</button
		>
	</div>
</div>

<!-- Put this part before </body> tag -->
<input type="checkbox" id="modal-insert" class="modal-toggle" checked={modalInsert} />
<div class="modal modal-bottom sm:modal-middle">
	<div class="modal-box">
		<h3 class="font-bold text-lg">Insert song</h3>

		<label for="set_list" class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400"
			>Add song to set list after {insertRef?.name}</label
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

		<label for="song_other" class="block mb-2 text-sm font-medium">Other</label>
		<input
			id="song_other"
			type="text"
			class="input input-bordered w-full max-w-xs"
			bind:value={selectedOther}
		/>
		<br />
		<br />

		<div class="modal-action">
			<button class="btn" on:click={() => (modalInsert = false)}>Cancel</button>
			<button class="btn btn-info" on:click={confirmInsertAfter}>Insert</button>
		</div>
	</div>
</div>

<input type="checkbox" id="modal-create" class="modal-toggle" checked={modalCreate} />
<div class="modal modal-bottom sm:modal-middle">
	<div class="modal-box">
		<h3 class="font-bold text-lg">Crate new set</h3>

		<label for="set_number" class="block mb-2 text-sm font-medium"
			>Set number (must not already exist)</label
		>
		<input
			type="number"
			name="set_number"
			id="set_number"
			class="input input-bordered w-full max-w-xs"
			bind:value={selectedSetNumber}
		/>
		<br />
		<br />

		<label for="set_list" class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400"
			>Add song</label
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

		<div class="modal-action">
			<button class="btn" on:click={() => (modalCreate = false)}>Cancel</button>
			<button class="btn btn-info" on:click={confirmCreateSet}>Insert</button>
		</div>
	</div>
</div>
