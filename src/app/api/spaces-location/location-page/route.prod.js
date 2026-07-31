import { getSession } from '../../neo4j_driver/route.prod.js';
import { toNativeTypes } from '../../neo4j_driver/utils.prod.js';


export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const placeName = searchParams.get('params');

    if (!placeName) {
        return new Response(JSON.stringify({ error: 'Missing required parameter: name' }), { status: 400 });
    }

    const session = await getSession();

    try {

        const placeQuery = `
            MATCH (p:Place {name: $placeName})
            OPTIONAL MATCH (c:Claim)-[:CLAIM_OF]->(p)

            WITH p, collect({
                chapter: c.chapter,
                page:    c.page,
                id: c.id,
                verified: c.verified,
                quote:   c.quote,
                notes:   c.notes,
                site:    c.site
            }) AS cleanClaims

            RETURN
                cleanClaims,
                p.name        AS name,
                p.type        AS type,
                p.description AS description,
                p.descriptionVerified AS descriptionVerified,
                p.evidence    AS evidence,
                p.lat         AS lat,
                p.lng         AS lng
        `;
        const placeResult = await session.readTransaction(tx =>
            tx.run(placeQuery, { placeName })
        );

        if (placeResult.records.length === 0) {
            return new Response(JSON.stringify({ error: 'Place not found' }), { status: 404 });
        }

        const pr = placeResult.records[0];
        const place = {
            name:        pr.get('name'),
            type:        pr.get('type'),
            description: pr.get('description'),
            descriptionVerified: pr.get('descriptionVerified'),
            evidence:    pr.get('evidence'),
            lat:         pr.get('lat')  != null ? toNativeTypes(pr.get('lat'))  : null,
            lng:         pr.get('lng')  != null ? toNativeTypes(pr.get('lng'))  : null,
        };

        function toNum(v) {
            if (v == null) return null;
            if (typeof v === 'object' && typeof v.low === 'number' && typeof v.high === 'number') {
                return v.high === 0 ? v.low : v.low + v.high * Math.pow(2, 32);
            }
            return v;
        }

        const claims = pr.get('cleanClaims').map(claim => ({
            chapter: toNum(claim.chapter),
            page:    toNum(claim.page),
            verified: claim.verified ?? null,
            id: claim.id ?? null,
            quote:   claim.quote ?? null,
            notes:   claim.notes ?? null,
            site:    claim.site ?? null,
        }));

        // ── 2. POEMS ──────────────────────────────────────────────────────────
        // TODO: confirm relationship names match your schema
        // Currently assumes PLACE_OF_COMPOSITION and PLACE_OF_RECEIPT point to Place nodes
        // and that poems have pnum, Japanese text, and a Washburn translation node
        const poemsQuery = `
            MATCH (p:Place {name: $placeName})

            OPTIONAL MATCH (compPoem:Genji_Poem)-[:PLACE_OF_COMPOSITION]->(p)
            OPTIONAL MATCH (s:Character)-[:SPEAKER_OF]->(compPoem)
            OPTIONAL MATCH (compPoem)<-[:ADDRESSEE_OF]-(a:Character)
            OPTIONAL MATCH (tComp:Translation)-[:TRANSLATION_OF]->(compPoem)
                WHERE toUpper(tComp.id) ENDS WITH 'W'

            WITH p,
                collect(DISTINCT {
                    pnum:        compPoem.pnum,
                    japanese:    compPoem.Japanese,
                    speaker:     s.name,
                    addressee:   a.name,
                    season:      compPoem.season,
                    translation: tComp.translation,
                    role:        'composed'
                }) AS composedPoems

            OPTIONAL MATCH (recPoem:Genji_Poem)-[:PLACE_OF_RECEIPT]->(p)
            OPTIONAL MATCH (rs:Character)-[:SPEAKER_OF]->(recPoem)
            OPTIONAL MATCH (recPoem)<-[:ADDRESSEE_OF]-(ra:Character)
            OPTIONAL MATCH (tRec:Translation)-[:TRANSLATION_OF]->(recPoem)
                WHERE toUpper(tRec.id) ENDS WITH 'W'

            WITH composedPoems,
                collect(DISTINCT {
                    pnum:        recPoem.pnum,
                    japanese:    recPoem.Japanese,
                    speaker:     rs.name,
                    addressee:   ra.name,
                    season:      recPoem.season,
                    translation: tRec.translation,
                    role:        'received'
                }) AS receivedPoems

            RETURN composedPoems, receivedPoems
        `;
        const poemsResult = await session.readTransaction(tx =>
            tx.run(poemsQuery, { placeName })
        );

        // Merge composed and received, upgrading overlapping pnums to role: 'both'
        const poemMap = new Map();

        const pr2 = poemsResult.records[0];
        const composedRaw = pr2?.get('composedPoems') || [];
        const receivedRaw = pr2?.get('receivedPoems') || [];

        for (const poem of composedRaw) {
            if (!poem.pnum) continue;
            poemMap.set(poem.pnum, { ...poem });
        }
        for (const poem of receivedRaw) {
            if (!poem.pnum) continue;
            if (poemMap.has(poem.pnum)) {
                poemMap.get(poem.pnum).role = 'both';
            } else {
                poemMap.set(poem.pnum, { ...poem });
            }
        }

        const poems = Array.from(poemMap.values()).map(poem => {
            const chapter = parseInt(poem.pnum?.substring(0, 2), 10);
            const number  = parseInt(poem.pnum?.slice(-2), 10);
            return {
                poemId:      poem.pnum,
                chapter,
                number,
                speaker:     poem.speaker     ?? null,
                addressee:   poem.addressee   ?? null,
                season:      poem.season      ?? null,
                japanese:    poem.japanese    ?? null,
                translation: poem.translation ?? null,
                role:        poem.role
            };
        }).sort((a, b) => a.poemId?.localeCompare(b.poemId));


        // ── RESPONSE ──────────────────────────────────────────────────────────
        return new Response(JSON.stringify({ place, poems, claims }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Location API error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    } finally {
        await session.close();
    }
}