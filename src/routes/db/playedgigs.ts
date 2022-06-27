import { db, getPlayedGig, selectDb } from '$lib/database';



export async function get() {
    let tA = Date.now()
    const res = await selectDb('SELECT * FROM played_gigs ORDER BY date_played DESC') as any[]

    for (const r of res) {
        await getPlayedGig(r)
    }

    //db.all('SELECT * FROM played_gigs PG INNER JOIN relations_played_gigs_songs RPGS ON PG.id = RPGS.played_gig_id', (err, rows) => {
    //    console.log('result select', err, rows)
    //})

    let tB = Date.now()
    const delta = tB - tA
    console.log('Delta time', delta)

    return {
        body: res
    };
}

export async function post({ request }) {
    const body = await request.json()
    console.log('post!', body)
    db.run('INSERT INTO played_gigs (gig_id, date_played, fee, diesel, contact_sent, other_information) VALUES (?, ?, ?, ?, ?, ?)', [body.location, body.date, body.fee, body.diesel, body.contactSent, body.otherInformation], function (err) {
        if (!err) {
            const playedGigId = this.lastID

            const stmt = db.prepare('INSERT INTO relations_played_gigs_songs (played_gig_id, song_id, music_key, other_information, set_number, internal_set_number) VALUES (?, ?, ?, ?, ?, ?)')

            for (const obj of body.setList) {
                stmt.run(playedGigId, obj.id, obj.music_key, obj.other_information, obj.set_number, obj.internal_set_number)
            }

            stmt.finalize()
        }
        else
            console.log(err)
    })
    //], (err, row) => {
    //    console.log(err, row)
    //    const stmt = db.prepare('INSERT INTO relations_played_gigs_songs (played_gig_id, song_id) VALUES (?, ?)')
    //    //stmt.run()
    //
    //})

    return {
        status: 200
    }
}