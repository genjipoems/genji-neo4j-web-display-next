import { getSession } from '../neo4j_driver/route.prod.js';
import { toNativeTypes } from '../neo4j_driver/utils.prod.js';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
	const chapter = (searchParams.get('chapter') || '1').replace(/^0+/, '');

    const session = await getSession();

    try {

		const query = `
            MATCH (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: $chapter})
            OPTIONAL MATCH (g)-[:PLACE_OF_COMPOSITION|PLACE_OF_RECEIPT]->(p:Place)
            WITH collect(DISTINCT {
                name: p.name,
                lat: p.lat,
                lng: p.lng,
                type: p.type,
                evidence: p.evidence
            }) as cleanPlaces

            MATCH (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: $chapter})
            OPTIONAL MATCH (s:Character)-[:SPEAKER_OF]->(g)
            OPTIONAL MATCH (g)<-[:ADDRESSEE_OF]-(a:Character)
			OPTIONAL MATCH (g)-[rComp:PLACE_OF_COMPOSITION]->(pComp:Place)
			OPTIONAL MATCH (g)-[rRec:PLACE_OF_RECEIPT]->(pRec:Place)
			OPTIONAL MATCH (g)<-[:MESSENGER_OF]-(mess:Character)

			OPTIONAL MATCH (g)-[:IN_GROUP_OF]->(group:Group)<-[:IN_GROUP_OF]-(otherPoems:Genji_Poem WHERE otherPoems.pnum <> g.pnum)
			OPTIONAL MATCH (g)-[:REPLY_TO]->(reply:Genji_Poem)
			OPTIONAL MATCH (repliesToThis:Genji_Poem)-[:REPLY_TO]->(g)

            OPTIONAL MATCH (t:Translation)-[:TRANSLATION_OF]->(g)
            WHERE toUpper(t.id) ENDS WITH 'W'

            WITH g, cleanPlaces, s, a, pComp, pRec, mess, t,
                 collect(DISTINCT otherPoems.pnum) as groupMembers,
                 collect(DISTINCT reply.pnum) as replyPoemList,
                 collect(DISTINCT repliesToThis.pnum) as repliesToThisList

            RETURN 
                g.pnum as pnum,
                cleanPlaces,
                t.translation as Washburn,
                s.name as speaker, s.gender as speakerGender,
                a.name as addressee, a.gender as addresseeGender,
                pComp.name as compName, pComp.lat as compLat, pComp.lng as compLng,
                pRec.name as recName, pRec.lat as recLat, pRec.lng as recLng,
                mess.name as messengerName,
                groupMembers,
                replyPoemList,
                repliesToThisList
        `;		
		const result = await session.readTransaction(tx => tx.run(query, { chapter }));
		console.log('records:', result.records.length);
        console.log('record count:', result.records.length);
		if (result.records.length > 0) {
			console.log('first record keys:', result.records[0].keys);
		}

        let places = [];
        const poemsData = {};

        if (result.records.length > 0) {
            places = (result.records[0].get('cleanPlaces') || [])
                .filter(p => p.name !== null)
                .map(p => ({
                    name: p.name,
                    type: p.type,
                    evidence: p.evidence,
                    lat: p.lat != null ? toNativeTypes(p.lat) : null,
                    lng: p.lng != null ? toNativeTypes(p.lng) : null
                }));
        }

        result.records.forEach(record => {
            const pnum = record.get('pnum');
            if (!pnum) return; 
            const speaker = record.get('speaker');
            const addressee = record.get('addressee');
            const speakerGender = record.get('speakerGender');
            const addresseeGender = record.get('addresseeGender');
            const messenger = record.get('messengerName');
            const groupPoems = record.get('groupMembers') || [];
            const replyPoems = record.get('replyPoemList') || [];
            const repliesToThis = record.get('repliesToThisList') || [];
            const compName = record.get('compName');
            const recName = record.get('recName');
            const washburn = record.get('Washburn');

            let compLat = null, compLng = null;
            let receiptLat = null, receiptLng = null;

            if (compName) {
				compLat = record.get('compLat') != null ? toNativeTypes(record.get('compLat')) : null;
				compLng = record.get('compLng') != null ? toNativeTypes(record.get('compLng')) : null;
            }

            if (recName) {
				receiptLat = record.get('recLat') != null ? toNativeTypes(record.get('recLat')) : null;
				receiptLng = record.get('recLng') != null ? toNativeTypes(record.get('recLng')) : null;
            }

            poemsData[pnum] = {
				pnum,
                composition: { placeName: compName, washburn, speaker, speakerGender, lat: compLat, lng: compLng },
                receipt: { placeName: recName, washburn, addressee, addresseeGender, lat: receiptLat, lng: receiptLng },
                relationships: { groupPoems, replyPoems, repliesToThis, messenger }
            };
        });

		const data = {
            places,
            poems: poemsData
        };

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("Database Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    } finally {
        await session.close();
    }
}