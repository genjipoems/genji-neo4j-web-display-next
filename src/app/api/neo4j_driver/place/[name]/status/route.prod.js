const { getSession } = require('../../../route.prod.js');
const { NextResponse } = require('next/server');

export async function PATCH(req, { params }) {
  const { name } = params;
  const { verified } = await req.json();

  if (!name || typeof verified !== 'boolean') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const session = await getSession();
  try {
    const result = await session.run(
      `MATCH (p:Place {name: $name})
       SET p.verified = $verified
       RETURN p`,
      { name, verified }
    );

    if (result.records.length === 0) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } finally {
    await session.close();
  }
}