import { getSession } from '../../neo4j_driver/route.prod.js';
import { checkServerSideAdmin } from '../../../../lib/auth-utils';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET all characters for dropdown
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
      MATCH (c:Character)
      RETURN c.name as name
      ORDER BY c.name ASC
    `;
    
    const result = await session.run(query);
    
    const characters = result.records.map(record => record.get('name'));
    
    return new Response(JSON.stringify(characters), { status: 200 });
  } catch (error) {
    console.error("GET characters error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  } finally {
    await session.close();
  }
}
