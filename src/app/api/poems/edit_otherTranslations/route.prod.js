import { getSession } from '../../neo4j_driver/route.prod.js';
import { checkServerSideAdmin } from '../../../../lib/auth-utils';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET all other translations for dropdown
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
      MATCH (ot:Other_Translation)
      RETURN ot.id as id, ot.name as name, ot.translation as translation
      ORDER BY ot.name ASC
    `;
    
    const result = await session.run(query);
    
    const otherTranslations = result.records.map(record => ({
      id: record.get('id'),
      name: record.get('name'),
      translation: record.get('translation')
    }));
    
    return new Response(JSON.stringify(otherTranslations), { status: 200 });
  } catch (error) {
    console.error("GET other translations error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  } finally {
    await session.close();
  }
}
