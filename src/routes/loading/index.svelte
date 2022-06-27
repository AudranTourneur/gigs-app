<script>
import { onMount } from "svelte";


    onMount(() => {
        setInterval(async () => {
            let res  = await fetch('/db/isloaded')
            let txt = await res.text()

            console.log(txt)
            if (txt == 'true') {
                location.href = "/playedgigs"
            }

        }, 1000)
    })
</script>

<div class="w-full h-full flex justify-center items-center">
	<div class="flex items-center justify-evenly w-[700px]">
		<img src="/loading.gif" alt="Loading" width="100" />
		<h1 class="text-[80px]">Loading</h1>
	</div>
</div>
