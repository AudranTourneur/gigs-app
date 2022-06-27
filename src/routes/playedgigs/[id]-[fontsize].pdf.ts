import { db, getPlayedGig, selectDb } from '$lib/database';

import PDFDocument from 'pdfkit';
import fs from 'fs';
import { convertDate } from '$lib/utils';
import { groupBy, orderBy } from 'lodash-es';

export async function get({ params }) {
    const id = params.id
    const fontSize = params.fontsize
    console.log(id, 'pdf')

    const res = await selectDb(`SELECT * FROM played_gigs WHERE id=${id}`) as any[]

    if (!res.length)
        return {
            body: 'Not found'
        }
    else {
        const r = await getPlayedGig(res[0])

        const MARGIN = 30
        const doc = new PDFDocument({ margin: MARGIN });

        let buffers = [];
        doc.on('data', buffers.push.bind(buffers));

        let i = 0
        for (const [k, v] of Object.entries(groupBy(r.set_list, 'set_number'))) {
            if (i > 0)
                doc.addPage({ margin: MARGIN })

            doc
            doc.fontSize(20)
                .text(r.location_name, 30, 30)
                .text(convertDate(r.date_played), 450, 30)

            doc.text(' ', 30, 50)

            doc.text(`                                        Set ${k}`)
            doc.text(' ')
            doc.text(' ')

            doc.fontSize(fontSize)

            for (const song of orderBy(v, 'internal_set_number')) {
                const dataSong = (await selectDb(`SELECT music_key FROM songs WHERE id=${song.id}`) as any)[0] as any
                console.log(dataSong)
                doc.text((song.internal_set_number + 1) + '.   ', { continued: true })
                //doc.font('Helvetica-Bold')
                doc.text(song.name.toUpperCase(), { continued: true })


                if (song.music_key)
                    doc.text(`    [${song.music_key}]`)
                else
                    doc.text(`    [${dataSong.music_key}]`)
                doc.moveDown(2.25)
            }
            i++
        }

        doc.end();

        const promisePdf = new Promise((resolve, reject) => {
            doc.on('end', () => {
                let pdfData = Buffer.concat(buffers);
                resolve(pdfData)
            });
        })

        const pdfFile = await promisePdf

        return {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                //"Content-Disposition": "attachment; filename=setlist_" + params.id + ".pdf"
            },
            body: pdfFile
        }
    }
}