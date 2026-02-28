const { getSession } = require('../../neo4j_driver/route.prod.js');

export const GET = async (request) => {
  const { searchParams } = new URL(request.url);
  const qRaw = searchParams.get('q') || '';
  const q = qRaw.trim();

  // Don’t hammer the DB for empty query
  if (!q) {
    return new Response(JSON.stringify({ suggestions: [] }), { status: 200 });
  }

  // Only numeric pnum suggestions (since you said “search by poem id/pnum”)
  // If you want to allow title search too, see the optional section below.

  const session = await getSession();

  try {
    // Adjust property names if needed:
    // - label: Genji_Poem
    // - properties: pnum, Romaji (or title)
    const cypher = `
      MATCH (p:Genji_Poem)
WHERE toUpper(toString(p.pnum)) STARTS WITH toUpper($q)
RETURN toString(p.pnum) AS pnum, COALESCE(p.Romaji, "") AS title, elementId(p) AS id
ORDER BY pnum
LIMIT 25
    `;

    const res = await session.readTransaction((tx) => tx.run(cypher, { q }));

    const suggestions = res.records.map((r) => ({
      pnum: r.get('pnum'),
      title: r.get('title'),
      id: r.get('id'),
    }));

    return new Response(JSON.stringify({ suggestions }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'poem_suggest failed', message: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await session.close();
  }
};