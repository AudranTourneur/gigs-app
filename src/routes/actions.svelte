<script>
	import { goto } from '$app/navigation';

	async function refresh() {
		await fetch('/db/reload', {
			method: 'POST'
		});

		goto('/loading');
	}
</script>

<div class="m-10">
	<button class="btn btn-lg btn-success" on:click={refresh}>Refresh</button>

	<a href="/db/export.xlsx">
		<button class="btn btn-lg btn-success">Export</button>
	</a>
</div>
