// Require library
import { selectDb, getPlayedGig } from '$lib/database';
import { groupBy } from 'lodash-es';
import XLSX from 'xlsx';

export async function get() {
    const res = await selectDb('SELECT * FROM played_gigs ORDER BY date_played DESC') as any[]

    for (const r of res) {
        await getPlayedGig(r)
    }


    //var data = [[1, 2, 3], [true, false, null, "sheetjs"], ["foo", "bar", new Date("2014-02-19T14:30Z"), "0.3"], ["baz", null, "qux"]]


    function formatSetList(list) {
        if (!list) return ""
        let blocks = []
        for (const [setN, set] of Object.entries(groupBy(list, 'set_number'))) {
            let block = `Set ${setN}\n${set.map(s => s.name).join('\n')}`
            blocks.push(block)
        }

        let str = blocks.join('\n')

        return str

    }

    let headers = ["ID", "Location", "Date played", "Set list", "Fee", "Diesel", "Other",]
    let body = res.map((r) => [r.id, r.location_name, r.date_played, formatSetList(r.set_list), r.fee, r.diesel, r.other_information])
    const data = [headers, ...body]
    let ws_name = "All played gigs";

    let wb = XLSX.utils.book_new()
    let ws = XLSX.utils.aoa_to_sheet(data);

    /* add worksheet to workbook */
    XLSX.utils.book_append_sheet(wb, ws, ws_name);
    ws['!cols'] = [null, { wch: 40 }, { wch: 15 }, { wch: 40 }]

    const buf = XLSX.write(wb, { type: "buffer" });

    return {
        headers: {
            'Content-Type': 'application/xlxs'
        },
        body: buf
    }

}