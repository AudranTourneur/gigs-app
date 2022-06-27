import { isDbLoaded } from "$lib/database";

export async function get() {
    return {
        body: isDbLoaded
    }
}