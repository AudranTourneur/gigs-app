import { db, getPlayedGig, selectDb } from '$lib/database';

export async function get({ params }) {
    const id = params.id
    const res = await selectDb(`SELECT * FROM played_gigs WHERE id=${id}`) as any[]

    if (!res.length) {
        return {
            status: 404,
            body: 'Not found'
        }
    }
    else {
        let r = res[0]
        r = await getPlayedGig(r)

        return {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(r)
        }
    }
}


export async function post({ params, request }) {
    const body = await request.json()
    console.log('post update', body)
    db.run(`UPDATE played_gigs SET gig_id=?, fee=?, diesel=?, other_information=?, date_played=? WHERE id=?`, [body.location, body.fee, body.diesel, body.otherInformation, body.date, body.id], function (err) {
        if (!err) {
            db.run('DELETE FROM relations_played_gigs_songs WHERE played_gig_id=?', [body.id], () => {
                const stmt = db.prepare('INSERT INTO relations_played_gigs_songs (played_gig_id, song_id, music_key, other_information, set_number, internal_set_number) VALUES (?, ?, ?, ?, ?, ?)')

                for (const obj of body.setList) {
                    stmt.run([body.id, obj.id, obj.music_key, obj.other_information, obj.set_number, obj.internal_set_number], err => {
                        if (err) console.log('err', err)
                    })
                }

                stmt.finalize()

            })
        }
    })

    return {
        status: 200,
        body: 'ok'
    }
}

export async function del({ params, request }) {
        db.run(`DELETE FROM played_gigs WHERE id=?`, [params.id])
        db.run(`DELETE FROM relations_played_gigs_songs WHERE played_gig_id=?`, [params.id])
        return {
            status: 200,
            body: 'OK'
        }
}