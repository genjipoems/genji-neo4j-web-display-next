import { getSession } from '../../neo4j_driver/route.prod.js';

export async function POST(request) {
  try {
    const { chapterName, description } = await request.json();
    
    if (!chapterName) {
      return new Response(JSON.stringify({ message: 'Chapter name is required' }), { status: 400 });
    }

    const session = await getSession();
    
    // Update the chapter description
    const query = `
      MATCH (ch:Chapter)
      WHERE toLower(ch.chapter_name) = toLower($chapterName)
      SET ch.Description = $description
      RETURN ch.chapter_name as name, ch.Description as description
    `;
    
    const result = await session.writeTransaction(tx => 
      tx.run(query, { 
        chapterName, 
        description: description || null 
      })
    );
    
    await session.close();
    
    if (result.records.length === 0) {
      return new Response(JSON.stringify({ message: 'Chapter not found' }), { status: 404 });
    }

    return new Response(JSON.stringify({ 
      message: 'Chapter description updated successfully',
      chapter: {
        name: result.records[0].get('name'),
        description: result.records[0].get('description')
      }
    }), { status: 200 });

  } catch (error) {
    console.error(`API error: ${error}`);
    return new Response(JSON.stringify({ 
      error: "Error updating chapter description", 
      message: error.toString() 
    }), { status: 500 });
  }
}