const { getSession } = require('../../route.prod');
const { NextResponse } = require('next/server');
import { withAdminAuth } from '../../../../../lib/auth-utils';
import client from '../../../../../lib/db.prod';

const REL_TYPE_MAP = {
  composition: 'PLACE_OF_COMPOSITION',
  receipt: 'PLACE_OF_RECEIPT',
};

export const PATCH = withAdminAuth(async (req, authSession, { params }) => {
  const { pnum } = params;
  const { relType, verified } = await req.json();

  const cypherRelType = REL_TYPE_MAP[relType];
  if (!cypherRelType || typeof verified !== 'boolean') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const actorId = authSession.user.id;
  const actorName = authSession.user.name || authSession.user.email;

  const session = await getSession();
  try {
    // relType is validated against a fixed lookup map above, not interpolated
    // from user input directly, so this is safe from injection.
    const result = await session.run(
      `MATCH (p:Genji_Poem {pnum: $pnum})-[r:${cypherRelType}]->(:Place)
       SET r.verified = $verified
       FOREACH (_ IN CASE WHEN $verified THEN [1] ELSE [] END |
        SET r.verifiedById = $actorId,
            r.verifiedByName = $actorName,
            r.verifiedAt = datetime()
       )
       FOREACH (_ IN CASE WHEN NOT $verified THEN [1] ELSE [] END |
        REMOVE r.verifiedById,
               r.verifiedByName,
               r.verifiedAt
       )
       RETURN r`,
      { pnum, verified, actorId, actorName }
    );

    if (result.records.length === 0) {
      return NextResponse.json({ error: 'Relationship not found' }, { status: 404 });
    }

    const relationship = result.records[0].get('r').properties;

    // Mirror the same SET/REMOVE behavior in Mongo: only the last person to
    // touch the switch is kept. Turning it off forgets the attribution
    // entirely — no history, just current state. Secondary write: if it
    // fails, log it but don't fail the response, since the Neo4j write (the
    // thing the admin is actually waiting on) already succeeded.
    try {
      const db = client.db(); // uses the default db from MONGODB_URI
      const attribution = db.collection('verificationAttribution');

      if (verified) {
        await attribution.updateOne(
          { pnum, relType },
          { $set: { actorId, actorName, verifiedAt: new Date() } },
          { upsert: true }
        );
      } else {
        await attribution.deleteOne({ pnum, relType });
      }
    } catch (attrErr) {
      console.error('Mongo attribution write failed:', attrErr);
    }

    return NextResponse.json({
      ok: true,
      verifiedByName: relationship.verifiedByName ?? null,
      actorName,
    });
  } finally {
    await session.close();
  }
});