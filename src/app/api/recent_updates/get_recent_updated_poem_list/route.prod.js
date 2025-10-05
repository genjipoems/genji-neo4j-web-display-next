// Get the list of recent updated poems that are not complete annotated
const { getSession } = require('../../neo4j_driver/route.prod.js');
import { toNativeTypes } from '../../neo4j_driver/utils.prod.js';

async function getRecentUpdatedPoemList() {
  const session = await getSession();

  try {
    const result = await session.readTransaction(tx =>
      tx.run(
        'MATCH (p:Genji_Poem) WHERE p.last_updated IS NOT NULL AND p.Complete = "false"  RETURN p.pnum as pnum, datetime({datetime: p.last_updated, timezone: "America/New_York"}) as last_updated_ny_time ORDER BY p.last_updated DESC',
      )
    );
    
    const recentUpdatedPoemList = result.records.map(record => ({
      pnum: record.get('pnum'),
      last_updated_ny_time: record.get('last_updated_ny_time').toString()
    }));
    
        return recentUpdatedPoemList;
  } catch(error) {
    console.error('Failed to fetch recent updated poem list:', error);
    throw new Error('Failed to fetch recent updated poem list');
  } finally {
    await session.close();
  }
}

// need to avoid caching
export const dynamic = 'force-dynamic';

export const GET = async (request) => {
  try {
    const recentUpdatedPoemList = await getRecentUpdatedPoemList();
    return new Response(JSON.stringify(recentUpdatedPoemList), {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Content-Type': 'application/json',
      }
    });
  } catch(error) {
    console.error('Failed to fetch recent updated poem list:', error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Content-Type': 'application/json',
      }
    });
  }
}