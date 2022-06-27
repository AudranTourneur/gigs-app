<script>
	import '../app.css';
</script>

<nav class="flex items-center justify-around mt-4">
	<a href="/gigs">Gigs</a>
	<a href="/songs">Songs</a>
	<a href="/playedgigs">Played gigs</a>
	<a href="/actions">Actions</a>
</nav>

<slot />

<style>
    a {
        font-size: 1.5rem;
    }
</style>