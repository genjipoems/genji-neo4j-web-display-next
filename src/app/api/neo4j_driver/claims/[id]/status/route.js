const { getSession } = require('../../../route.prod');
const { NextResponse } = require('next/server');

export async function PATCH(req, { params }) {
  const { id } = params;
  const { verified } = await req.json();

  if (!id || typeof verified !== 'boolean') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const session = await getSession();
  try {
    const result = await session.run(
      `MATCH (c:Claim {id: $id})
       SET c.verified = $verified
       RETURN c`,
      { id, verified }
    );

    if (result.records.length === 0) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } finally {
    await session.close();
  }
}