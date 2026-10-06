const { getSession } = require('../../../route.prod');
const { NextResponse } = require('next/server');
import { withAdminAuth } from '../../../../../../lib/auth-utils';

export const PATCH = withAdminAuth(async (req, authSession, { params }) => {
  const { id } = params;
  const { verified } = await req.json();

  if (!id || typeof verified !== 'boolean') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const actorId = authSession.user.id;
  const actorName = authSession.user.name || authSession.user.email;

  const session = await getSession();
  try {
    const result = await session.run(
      `MATCH (c:Claim {id: $id})
       SET c.verified = $verified
       FOREACH (_ IN CASE WHEN $verified THEN [1] ELSE [] END |
        SET c.verifiedById = $actorId,
            c.verifiedByName = $actorName,
            c.verifiedAt = datetime()
       )
       FOREACH (_ IN CASE WHEN NOT $verified THEN [1] ELSE [] END |
        REMOVE c.verifiedById,
               c.verifiedByName,
               c.verifiedAt
       )
       RETURN c`,
      { id, verified, actorId, actorName }
    );

    if (result.records.length === 0) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    const claim = result.records[0].get('c').properties;

    return NextResponse.json({
      ok: true,
      verifiedByName: claim.verifiedByName ?? null,
      actorName,
    });
  } finally {
    await session.close();
  }
});