//import Database from 'sqlite-async'
import sqlite3, { Database } from 'sqlite3'
//const sqlite3 = require('sqlite3').verbose();


import readXlsxFile from 'read-excel-file/node';


export let isDbLoaded = false

export const db = new sqlite3.Database('./files/database.db');

//export const db = await Database.open('./test.db')

export function selectDb(req) {
    return new Promise((resolve, reject) => {
        const queries = [];
        db.each(req, (err, row) => {
            if (err) {
                reject(err); // optional: you might choose to swallow errors.
            } else {
                queries.push(row); // accumulate the data
            }
        }, (err, n) => {
            if (err) {
                reject(err); // optional: again, you might choose to swallow this error.
            } else {
                resolve(queries); // resolve the promise
            }
        });
    });
}

export function selectAllFromTable(table: string) {
    return new Promise((resolve, reject) => {
        const queries = [];
        db.each(`SELECT rowid as key, * FROM ${table}`, (err, row) => {
            if (err) {
                reject(err); // optional: you might choose to swallow errors.
            } else {
                queries.push(row); // accumulate the data
            }
        }, (err, n) => {
            if (err) {
                reject(err); // optional: again, you might choose to swallow this error.
            } else {
                resolve(queries); // resolve the promise
            }
        });
    });
}

export function runDb(req: string) {
    return new Promise((resolve, reject) => {
        db.run(req, (res, err) => {
            if (err) {
                reject(err)
            }
            else {
                resolve(res)
            }
        })
    })
}

export function setIsdbLoaded(v) {
    isDbLoaded = v
}

export async function initDb() {
    let start = Date.now()

    isDbLoaded = false

    console.log('CALL init')

    // ID Venue Address Postcode Region Email Website Organiser Telephone Guest night Position in month 
    await runDb(`CREATE TABLE IF NOT EXISTS gigs (id INTEGER, venue TEXT, address TEXT, postcode TEXT, region TEXT, email TEXT, website TEXT, organiser TEXT, telephone TEXT, guest_night TEXT, county TEXT, country TEXT, other_information TEXT, PRIMARY KEY("id" AUTOINCREMENT))`);

    // ID Name Key Genre Tempo Key Steve gtr Lynn gtr Steve vox Lynn vox Percussion
    await runDb(`CREATE TABLE IF NOT EXISTS songs (id INTEGER, name TEXT, music_key TEXT, genre TEXT, tempo TEXT, steve_gtr TEXT, lynn_gtr TEXT, steve_vox TEXT, lynn_vox TEXT, percussion TEXT, PRIMARY KEY("id" AUTOINCREMENT))`);

    // Dates played Fee CDs Diesel Contact sent Other information
    await runDb(`CREATE TABLE IF NOT EXISTS played_gigs (id INTEGER, gig_id INTEGER, date_played DATE, fee NUMERIC, diesel NUMERIC, contact_sent TEXT, other_information TEXT, PRIMARY KEY("id" AUTOINCREMENT), FOREIGN KEY(gig_id) REFERENCES gigs(id))`);
    //await runDb('DELETE FROM gigs_played');

    await runDb(`CREATE TABLE IF NOT EXISTS relations_played_gigs_songs (played_gig_id INTEGER, song_id INTEGER, music_key TEXT, other_information TEXT, set_number INTEGER, internal_set_number INTEGER, PRIMARY KEY("played_gig_id", "song_id"), FOREIGN KEY(played_gig_id) REFERENCES played_gigs(id), FOREIGN KEY(song_id) REFERENCES songs(id))`);

    console.log('pre', (await selectAllFromTable('gigs')))


    // File path.
    let promiseGigs = new Promise((resolve, reject) => {
        readXlsxFile('files/Spreadsheet_gigs.xlsx').then(async (rows) => {
            await runDb('DELETE FROM gigs');

            const stmt = db.prepare(`INSERT INTO gigs (id, venue, address, county, country, website, guest_night, email, other_information) VALUES ${Array(rows.length - 1).fill("(?, ?, ?, ?, ?, ?, ?, ?, ?)").join(', ')}`);

            let args = []

            for (let i = 1; i < rows.length; i++) {
                const [id, visited, venue, address, county, country, website, guest_night, contact_sent, email] = rows[i]
                console.log('INSERT gigs', id, venue, address, website)

                args.push(...[id, venue, address, county, country, website, guest_night, email, null])

                //arr.push(new Promise((res, rej) => {
                //    stmt.run([id, venue, address, county, country, website, guest_night, email, null], () => {
                //        res(null)
                //    });
                //}))
            }

            await new Promise((res, rej) => {
                stmt.run(args, () => res(null))
            })

            stmt.finalize(() => {
                resolve(null)
            });
            // `rows` is an array of rows
            // each row being an array of cells.
        })
    })

    await promiseGigs


    // File path.

    let promiseSongs = new Promise((resolve, reject) => {
        readXlsxFile('files/Spreadsheet_songs.xlsx').then(async (rows) => {
            await runDb('DELETE FROM songs');

            const stmt = db.prepare(`INSERT INTO songs VALUES ${Array(rows.length - 1).fill("(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(', ')}`);

            let args = []

            for (let i = 1; i < rows.length; i++) {
                const [id, name, music_key, genre, tempo, steve_gtr, lynn_gtr, steve_vox, lynn_vox, percussion] = rows[i]
                console.log('INSERT songs', id, name, music_key, genre, tempo, steve_gtr, lynn_gtr, steve_vox, lynn_vox, percussion)

                args.push(...[id, name, music_key, genre, tempo, steve_gtr, lynn_gtr, steve_vox, lynn_vox, percussion])

                //arr.push(await new Promise((res, rej) => {
                //    stmt.run([id, name, music_key, genre, tempo, steve_gtr, lynn_gtr, steve_vox, lynn_vox, percussion], () => {
                //        res(null)
                //    });
                //}))
            }

            //await Promise.allSettled(arr)
            await new Promise((res, rej) => {
                stmt.run(args, () => res(null))
            })


            stmt.finalize(() => {
                resolve(null)
            });
            // `rows` is an array of rows
            // each row being an array of cells.
        })
    })

    await promiseSongs


    isDbLoaded = true

    let end = Date.now()
    const delta = end - start
    console.log(`Initialization took ${delta}ms`)
}

initDb()

export async function getPlayedGig(r) {
    const subRequest = `
        SELECT songs.id, songs.name, relations_played_gigs_songs.set_number,  relations_played_gigs_songs.internal_set_number, relations_played_gigs_songs.music_key,  relations_played_gigs_songs.other_information
        FROM songs
        INNER JOIN relations_played_gigs_songs
        ON songs.id = relations_played_gigs_songs.song_id
        WHERE relations_played_gigs_songs.played_gig_id = ${r.id}
    `

    r.set_list = await selectDb(subRequest)

    r.location = r.gig_id

    const gigInfo = await selectDb(`SELECT venue FROM gigs WHERE id=${r.gig_id}`) as any
    //console.log({ gigInfo })

    if (gigInfo[0])
        r.location_name = gigInfo[0].venue

    return r
}