import { getSession } from '../../neo4j_driver/route.prod.js';
import { toNativeTypes } from '../../neo4j_driver/utils.prod.js';

const TRANSLATOR_SUFFIX = {
    W: 'washburn',
    S: 'seidensticker',
    A: 'waley',
    C: 'cranston',
    T: 'tyler',
};

export async function GET() {
    const session = await getSession();

    try {
        const query = `
            MATCH (g:Genji_Poem)-[:INCLUDED_IN]->(ch:Chapter)
            OPTIONAL MATCH (g)-[:PLACE_OF_COMPOSITION|PLACE_OF_RECEIPT]->(p:Place)
            WITH g, ch, collect(DISTINCT {
                name: p.name, lat: p.lat, lng: p.lng, type: p.type,
                description: p.description, evidence: p.evidence, verified: p.verified
            }) as cleanPlaces

            OPTIONAL MATCH (s:Character)-[:SPEAKER_OF]->(g)
            OPTIONAL MATCH (g)<-[:ADDRESSEE_OF]-(a:Character)
            OPTIONAL MATCH (g)-[rComp:PLACE_OF_COMPOSITION]->(pComp:Place)
            OPTIONAL MATCH (g)-[rRec:PLACE_OF_RECEIPT]->(pRec:Place)
            OPTIONAL MATCH (g)<-[:MESSENGER_OF]-(mess:Character)

            OPTIONAL MATCH (g)-[:IN_GROUP_OF]->(group:Group)<-[:IN_GROUP_OF]-(otherPoems:Genji_Poem WHERE otherPoems.pnum <> g.pnum)
            OPTIONAL MATCH (g)-[:REPLY_TO]->(reply:Genji_Poem)
            OPTIONAL MATCH (repliesToThis:Genji_Poem)-[:REPLY_TO]->(g)

            OPTIONAL MATCH (t:Translation)-[:TRANSLATION_OF]->(g)

            WITH g, ch, cleanPlaces, s, a, pComp, pRec, rComp, rRec, mess,
                collect(DISTINCT otherPoems.pnum) as groupMembers,
                collect(DISTINCT reply.pnum) as replyPoemList,
                collect(DISTINCT repliesToThis.pnum) as repliesToThisList,
                collect(DISTINCT {id: t.id, translation: t.translation}) as translations

                RETURN 
                ch.chapter_number as chapterNum,
                g.pnum as pnum,
                cleanPlaces,
                translations,
                rComp.evidence as compevidence, rComp.verified as compevverified,
                rRec.evidence as recevidence, rRec.verified as recevverified,
                s.name as speaker, s.gender as speakerGender,
                a.name as addressee, a.gender as addresseeGender,
                pComp.name as compName, pComp.lat as compLat, pComp.lng as compLng,
                pRec.name as recName, pRec.lat as recLat, pRec.lng as recLng,
                mess.name as messengerName,
                groupMembers,
                replyPoemList,
                repliesToThisList
        `;

        const result = await session.readTransaction(tx => tx.run(query));

        const placesByName = new Map();
        const poemsData = {};

        result.records.forEach(record => {
            const pnum = record.get('pnum');
            if (!pnum) return;

            const chapterNum = record.get('chapterNum');
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

            const rawTranslations = record.get('translations') || [];
            const translationsByKey = {};
            rawTranslations.forEach(t => {
                if (!t.id || !t.translation) return;
                const suffix = t.id.toUpperCase().slice(-1);
                const key = TRANSLATOR_SUFFIX[suffix];
                if (key) translationsByKey[key] = t.translation;
            });

            (record.get('cleanPlaces') || []).forEach(p => {
                if (p.name && !placesByName.has(p.name)) {
                    placesByName.set(p.name, {
                        name: p.name,
                        type: p.type,
                        description: p.description,
                        verified: p.verified,
                        evidence: p.evidence,
                        lat: p.lat != null ? toNativeTypes(p.lat) : null,
                        lng: p.lng != null ? toNativeTypes(p.lng) : null,
                    });
                }
            });

            let compEv = null, compEvVerified = null, compLat = null, compLng = null;
            let recEv = null, recEvVerified = null, receiptLat = null, receiptLng = null;

            if (compName) {
                compEv = record.get('compevidence') ?? null;
                compEvVerified = record.get('compevverified') ?? null;
                compLat = record.get('compLat') != null ? toNativeTypes(record.get('compLat')) : null;
                compLng = record.get('compLng') != null ? toNativeTypes(record.get('compLng')) : null;
            }
            if (recName) {
                recEv = record.get('recevidence') ?? null;
                recEvVerified = record.get('recevverified') ?? null;
                receiptLat = record.get('recLat') != null ? toNativeTypes(record.get('recLat')) : null;
                receiptLng = record.get('recLng') != null ? toNativeTypes(record.get('recLng')) : null;
            }

            poemsData[pnum] = {
                pnum,
                chapterNum,
                composition: { placeName: compName, ...translationsByKey, speaker, speakerGender, evidence: compEv, verified: compEvVerified, lat: compLat, lng: compLng },
                receipt: { placeName: recName, ...translationsByKey, addressee, addresseeGender, evidence: recEv, verified: recEvVerified, lat: receiptLat, lng: receiptLng },
                relationships: { groupPoems, replyPoems, repliesToThis, messenger },
            };
        });

        return new Response(JSON.stringify({ places: Array.from(placesByName.values()), poems: poemsData }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Database Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    } finally {
        await session.close();
    }
}