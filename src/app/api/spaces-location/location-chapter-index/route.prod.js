import { getSession } from '../../neo4j_driver/route.prod.js';
import { toNativeTypes } from '../../neo4j_driver/utils.prod.js';

// The map needs more than place names: LocationMap also renders the
// translation, people, evidence, and inter-poem relationships for each node.
export async function GET() {
    const session = await getSession();

    try {
        const query = `
            MATCH (g:Genji_Poem)-[:INCLUDED_IN]->(chapter:Chapter)
            OPTIONAL MATCH (speaker:Character)-[:SPEAKER_OF]->(g)
            OPTIONAL MATCH (g)<-[:ADDRESSEE_OF]-(addressee:Character)
            OPTIONAL MATCH (g)-[compositionRelation:PLACE_OF_COMPOSITION]->(composition:Place)
            OPTIONAL MATCH (g)-[receiptRelation:PLACE_OF_RECEIPT]->(receipt:Place)
            OPTIONAL MATCH (g)<-[:MESSENGER_OF]-(messenger:Character)
            OPTIONAL MATCH (g)-[:IN_GROUP_OF]->(:Group)<-[:IN_GROUP_OF]-(groupPoem:Genji_Poem)
            WHERE groupPoem.pnum <> g.pnum
            OPTIONAL MATCH (g)-[:REPLY_TO]->(replyPoem:Genji_Poem)
            OPTIONAL MATCH (repliesToThis:Genji_Poem)-[:REPLY_TO]->(g)
            OPTIONAL MATCH (translation:Translation)-[:TRANSLATION_OF]->(g)
            WHERE toUpper(translation.id) ENDS WITH 'W'
            WITH g, chapter, composition, receipt, compositionRelation, receiptRelation,
                [value IN collect(DISTINCT { name: speaker.name, gender: speaker.gender }) WHERE value.name IS NOT NULL] AS speakers,
                [value IN collect(DISTINCT { name: addressee.name, gender: addressee.gender }) WHERE value.name IS NOT NULL] AS addressees,
                [value IN collect(DISTINCT messenger.name) WHERE value IS NOT NULL] AS messengers,
                [value IN collect(DISTINCT groupPoem.pnum) WHERE value IS NOT NULL] AS groupPoems,
                [value IN collect(DISTINCT replyPoem.pnum) WHERE value IS NOT NULL] AS replyPoems,
                [value IN collect(DISTINCT repliesToThis.pnum) WHERE value IS NOT NULL] AS repliesToThis,
                [value IN collect(DISTINCT translation.translation) WHERE value IS NOT NULL] AS translations
            RETURN
                g.pnum AS pnum,
                chapter.chapter_number AS chapterNum,
                g.Japanese AS japanese,
                g.Romaji AS romaji,
                head(speakers) AS speaker,
                head(addressees) AS addressee,
                head(messengers) AS messenger,
                head(translations) AS washburn,
                groupPoems, replyPoems, repliesToThis,
                composition.name AS compositionName,
                composition.lat AS compositionLat,
                composition.lng AS compositionLng,
                composition.type AS compositionType,
                composition.description AS compositionDescription,
                compositionRelation.evidence AS compositionEvidence,
                compositionRelation.verified AS compositionVerified,
                receipt.name AS receiptName,
                receipt.lat AS receiptLat,
                receipt.lng AS receiptLng,
                receipt.type AS receiptType,
                receipt.description AS receiptDescription,
                receiptRelation.evidence AS receiptEvidence,
                receiptRelation.verified AS receiptVerified
            ORDER BY chapterNum, pnum
        `;

        const result = await session.readTransaction((tx) => tx.run(query));
        const scalar = (value) => value == null ? null : toNativeTypes({ value }).value;
        const poems = result.records.map((record) => {
            const speaker = record.get('speaker') || {};
            const addressee = record.get('addressee') || {};
            const washburn = record.get('washburn') || null;

            return {
                pnum: record.get('pnum'),
                chapterNum: String(scalar(record.get('chapterNum')) ?? '').padStart(2, '0'),
                japanese: record.get('japanese') || '',
                romaji: record.get('romaji') || '',
                speaker_name: speaker.name || '',
                addressee_name: addressee.name || '',
                composition: {
                    placeName: record.get('compositionName') || null,
                    lat: scalar(record.get('compositionLat')),
                    lng: scalar(record.get('compositionLng')),
                    type: record.get('compositionType') || null,
                    description: record.get('compositionDescription') || null,
                    speaker: speaker.name || null,
                    speakerGender: speaker.gender || null,
                    washburn,
                    evidence: record.get('compositionEvidence') || null,
                    verified: record.get('compositionVerified') ?? null,
                },
                receipt: {
                    placeName: record.get('receiptName') || null,
                    lat: scalar(record.get('receiptLat')),
                    lng: scalar(record.get('receiptLng')),
                    type: record.get('receiptType') || null,
                    description: record.get('receiptDescription') || null,
                    addressee: addressee.name || null,
                    addresseeGender: addressee.gender || null,
                    washburn,
                    evidence: record.get('receiptEvidence') || null,
                    verified: record.get('receiptVerified') ?? null,
                },
                relationships: {
                    messenger: record.get('messenger') || null,
                    groupPoems: record.get('groupPoems') || [],
                    replyPoems: record.get('replyPoems') || [],
                    repliesToThis: record.get('repliesToThis') || [],
                },
            };
        });

        return Response.json({ poems });
    } catch (error) {
        console.error('Location chapter index API error:', error);
        return Response.json({ error: 'Unable to load poem map data' }, { status: 500 });
    } finally {
        await session.close();
    }
}
