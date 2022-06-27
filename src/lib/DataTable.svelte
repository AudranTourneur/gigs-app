<script>
	export let displayFields;
	export let objectFields;
	export let data;
</script>

<div class="relative overflow-x-auto shadow-md sm:rounded-lg mx-10">
	<table class="w-full text-lg text-left">
		<thead class="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
			<tr>
				{#each displayFields as field}
					<th scope="col" class="py-3">{field}</th>
				{/each}
			</tr>
		</thead>
		<tbody class="text-base-content">
			{#each data as obj}
				<tr class="border-b">
					{#each objectFields as field}
						<td class="py-4">{@html obj[field] ?? ''}</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
