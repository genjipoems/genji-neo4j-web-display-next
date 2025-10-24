import { getSession } from '../../neo4j_driver/route.prod.js';
import { checkServerSideAdmin } from '../../../../lib/auth-utils';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET all places for dropdown
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
      MATCH (p:Place)
      RETURN p.name as name
      ORDER BY p.name ASC
    `;
    
    const result = await session.run(query);
    
    const places = result.records.map(record => record.get('name'));
    
    return new Response(JSON.stringify(places), { status: 200 });
  } catch (error) {
    console.error("GET places error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  } finally {
    await session.close();
  }
}
