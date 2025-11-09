import { getSession } from '../../neo4j_driver/route.prod.js';

export async function POST(request) {
  try {
    const { characterName, description } = await request.json();
    
    if (!characterName) {
      return new Response(JSON.stringify({ message: 'Character name is required' }), { status: 400 });
    }

    const session = await getSession();
    
    // Update the character description
    const query = `
      MATCH (ch:Character)
      WHERE toLower(ch.name) = toLower($characterName)
      SET ch.Description = $description
      RETURN ch.name as name, ch.Description as description
    `;
    
    const result = await session.writeTransaction(tx => 
      tx.run(query, { 
        characterName, 
        description: description || null 
      })
    );
    
    await session.close();
    
    if (result.records.length === 0) {
      return new Response(JSON.stringify({ message: 'Character not found' }), { status: 404 });
    }

    return new Response(JSON.stringify({ 
      message: 'Character description updated successfully',
      character: {
        name: result.records[0].get('name'),
        description: result.records[0].get('description')
      }
    }), { status: 200 });

  } catch (error) {
    console.error(`API error: ${error}`);
    return new Response(JSON.stringify({ 
      error: "Error updating character description", 
      message: error.toString() 
    }), { status: 500 });
  }
}