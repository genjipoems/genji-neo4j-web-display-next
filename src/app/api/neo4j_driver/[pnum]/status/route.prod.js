const { getSession } = require('../../route.prod');
const { NextResponse } = require('next/server');

const REL_TYPE_MAP = {
  composition: 'PLACE_OF_COMPOSITION',
  receipt: 'PLACE_OF_RECEIPT',
};

export async function PATCH(req, { params }) {
  const { pnum } = params;
  const { relType, verified } = await req.json();

  const cypherRelType = REL_TYPE_MAP[relType];
  if (!cypherRelType || typeof verified !== 'boolean') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const session = await getSession();
  try {
    // relType is validated against a fixed lookup map above, not interpolated
    // from user input directly, so this is safe from injection.
    const result = await session.run(
      `MATCH (p:Genji_Poem {pnum: $pnum})-[r:${cypherRelType}]->(:Place)
       SET r.verified = $verified
       RETURN r`,
      { pnum, verified }
    );

    if (result.records.length === 0) {
      return NextResponse.json({ error: 'Relationship not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } finally {
    await session.close();
  }
}