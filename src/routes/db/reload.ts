import { initDb, setIsdbLoaded } from "$lib/database";

export async function post() {
    console.log('reload has been requested')

    setIsdbLoaded(false)
    initDb()

    return {
        status: 200,
        body: "ok"
    }
}