export const dynamic = 'force-dynamic';

import { getSession } from '../../neo4j_driver/route.prod.js';
import { checkServerSideAdmin } from '../../../../lib/auth-utils';

// GET all seasonal words for dropdown
export async function GET(request) {
  // Check if user is admin before allowing access to edit data
  const { isAdmin } = await checkServerSideAdmin();
  if (!isAdmin) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized. Admin access required.' }), 
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const session = await getSession();
  
  try {
    const query = `
      MATCH (sw:Seasonal_Word)
      RETURN sw.english as english, sw.japanese as japanese
      ORDER BY sw.english ASC
    `;
    
    const result = await session.run(query);
    
    const seasonalWords = result.records.map(record => ({
      english: record.get('english'),
      japanese: record.get('japanese')
    }));
    
    return new Response(JSON.stringify(seasonalWords), { status: 200 });
  } catch (error) {
    console.error("GET seasonal words error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  } finally {
    await session.close();
  }
}
