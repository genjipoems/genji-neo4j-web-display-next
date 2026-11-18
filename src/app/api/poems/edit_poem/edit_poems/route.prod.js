import { getSession } from '../../../neo4j_driver/route.prod.js';
import { checkServerSideAdmin } from '../../../../../lib/auth-utils';

export async function GET() {
  const { isAdmin } = await checkServerSideAdmin();
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
  }
  const session = await getSession();
  try {
    const result = await session.readTransaction(tx =>
      tx.run(`MATCH (g:Genji_Poem) RETURN g.pnum AS pnum ORDER BY pnum`)
    );
    return new Response(JSON.stringify(result.records.map(r => r.get('pnum'))), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  } finally {
    await session.close();
  }
}