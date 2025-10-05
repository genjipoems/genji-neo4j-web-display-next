// Get the list of complete annotated poems
const { getSession } = require('../../neo4j_driver/route.prod.js');
import { toNativeTypes } from '../../neo4j_driver/utils.prod.js';

async function getCompletePoemList() {
  const session = await getSession();

  try {
    const result = await session.readTransaction(tx =>
      tx.run(
        'MATCH (p:Genji_Poem) WHERE p.Complete = "true" RETURN p.pnum as pnum, datetime({datetime: p.last_updated, timezone: "America/New_York"}) as last_updated_ny_time ORDER BY p.last_updated DESC',
      )
    );
    
    const completePoemList = result.records.map(record => ({
      pnum: record.get('pnum'),
      last_updated_ny_time: record.get('last_updated_ny_time').toString()
    }));
    
    return completePoemList;
  } catch(error) {
    console.error('Failed to fetch complete poem list:', error);
    throw new Error('Failed to fetch complete poem list');
  } finally {
    await session.close();
  }
}

// need to avoid caching
export const dynamic = 'force-dynamic';

export const GET = async (request) => {
  try {
    const completePoemList = await getCompletePoemList();
    return new Response(JSON.stringify(completePoemList), {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Content-Type': 'application/json',
      }
    });
  } catch(error) {
    console.error('Failed to fetch complete poem list:', error);
    return new Response(JSON.stringify({ message: "Internal server error" }), { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Content-Type': 'application/json',
      }
    });
  }
}