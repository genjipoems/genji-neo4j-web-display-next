const { getSession } = require('../../../route.prod');
const { NextResponse } = require('next/server');
import { withAdminAuth } from '../../../../../../lib/auth-utils';

export const PATCH = withAdminAuth(async (req, authSession, { params }) => {
  const { name } = params;
  const { verified } = await req.json();

  if (!name || typeof verified !== 'boolean') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const actorId = authSession.user.id;
  const actorName = authSession.user.name || authSession.user.email;

  const session = await getSession();
  try {
    const result = await session.run(
      `MATCH (p:Place {name: $name})
       SET p.descriptionVerified = $verified
       FOREACH (_ IN CASE WHEN $verified THEN [1] ELSE [] END |
        SET p.descriptionVerifiedById = $actorId,
            p.descriptionVerifiedByName = $actorName,
            p.descriptionVerifiedAt = datetime()
       )
       FOREACH (_ IN CASE WHEN NOT $verified THEN [1] ELSE [] END |
        REMOVE p.descriptionVerifiedById,
               p.descriptionVerifiedByName,
               p.descriptionVerifiedAt
       )
       RETURN p`,
      { name, verified, actorId, actorName }
    );

    if (result.records.length === 0) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 });
    }

    const place = result.records[0].get('p').properties;

    return NextResponse.json({
      ok: true,
      verifiedByName: place.descriptionVerifiedByName ?? null,
      actorName,
    });
  } finally {
    await session.close();
  }
});