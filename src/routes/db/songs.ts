import {selectAllFromTable} from '$lib/database';

export async function get() {
    const res = await selectAllFromTable('songs')

    return {
        body: res
    };

}