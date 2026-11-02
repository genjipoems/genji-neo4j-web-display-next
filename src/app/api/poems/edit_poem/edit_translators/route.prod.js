import { getSession } from '../../../neo4j_driver/route.prod.js';

export async function GET() {
  const session = await getSession();
  try {
    const result = await session.readTransaction(tx =>
      tx.run(
        `MATCH (tr:Translator)
        RETURN tr.name AS name, tr.FullName AS fullName
        ORDER BY coalesce(tr.order, 999), tr.name`
      )
    );
    const translators = result.records.map(r => ({
      name: r.get('name'),
      fullName: r.get('fullName') || r.get('name'),
    }));
    return new Response(JSON.stringify(translators), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  } finally {
    await session.close();
  }
}