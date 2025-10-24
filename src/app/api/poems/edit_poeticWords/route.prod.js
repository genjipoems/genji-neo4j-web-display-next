import { getSession } from '../../neo4j_driver/route.prod.js';
import { checkServerSideAdmin } from '../../../../lib/auth-utils';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET all poetic words for dropdown
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
      MATCH (pw:Poetic_Word)
      RETURN pw.name as name, pw.kanji_hiragana as kanji_hiragana, pw.english_equiv as english_equiv, pw.gloss as gloss
      ORDER BY pw.name ASC
    `;
    
    const result = await session.run(query);
    
    const poeticWords = result.records.map(record => ({
      name: record.get('name'),
      kanji_hiragana: record.get('kanji_hiragana'),
      english_equiv: record.get('english_equiv'),
      gloss: record.get('gloss')
    }));
    
    return new Response(JSON.stringify(poeticWords), { status: 200 });
  } catch (error) {
    console.error("GET poetic words error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  } finally {
    await session.close();
  }
}
