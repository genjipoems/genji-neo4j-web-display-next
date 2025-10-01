import { getSession } from '../neo4j_driver/route.prod.js';
import { toNativeTypes } from '../neo4j_driver/utils.prod.js';

// Query for getting character information along with all character names
// Used in character page
async function getCharacterData(name) {
  
  try {
    const session = await getSession();
    
    // First, check if the character exists with a simple query
    const checkQuery = `
      MATCH (c:Character)
      WHERE toLower(c.name) = toLower($name)
      RETURN c.name as name
    `;
    
    const checkResult = await session.readTransaction(tx => tx.run(checkQuery, { name }));
    
    if (checkResult.records.length === 0) {
      console.log(`Character "${name}" not found in database`);
      
      // Get a list of available characters to help debugging
      const listQuery = `
        MATCH (c:Character)
        RETURN c.name as name
        ORDER BY c.name
        LIMIT 10
      `;
      
      const listResult = await session.readTransaction(tx => tx.run(listQuery));
      const availableCharacters = listResult.records.map(record => record.get('name'));
      
      await session.close();
      return null;
    }
    
    // Neo4j cypher query to fetch character data, related characters, and related poems
    const query = `
      MATCH (c:Character)
      WHERE toLower(c.name) = toLower($name)

      // Related characters
      OPTIONAL MATCH (c)-[r1]->(related:Character)

      // Nicknames
      OPTIONAL MATCH (c)-[:AKA]->(nickname:Nickname)

      WITH c,
          collect(DISTINCT {name: related.name, relationship: type(r1), gender: related.gender}) AS relatedCharacters,
          collect(DISTINCT nickname.nickname) AS nicknames

      // Subquery: sorted poems (ascending)
      CALL {
        WITH c
        MATCH (poem:Genji_Poem)<-[r2:ADDRESSEE_OF|SPEAKER_OF]-(c)
        OPTIONAL MATCH (poem)-[:INCLUDED_IN]->(chapter:Chapter)
        OPTIONAL MATCH (poem)<-[:SPEAKER_OF]-(speaker:Character)
        OPTIONAL MATCH (poem)<-[:ADDRESSEE_OF]-(addressee:Character)
        WHERE poem IS NOT NULL AND poem.pnum IS NOT NULL AND chapter.chapter_number IS NOT NULL
        WITH poem, chapter.chapter_number AS chapNum,
            speaker, collect(DISTINCT addressee) as addressees,
            toInteger(apoc.text.regexGroups(poem.pnum, '\\d+$')[0][0]) AS pnumInt
        ORDER BY chapNum ASC, pnumInt ASC
        RETURN collect(DISTINCT {
          pnum: poem.pnum,
          Japanese: poem.Japanese,
          Romaji: poem.Romaji,
          speaker_name: COALESCE(speaker.name, ""),
          speaker_gender: COALESCE(speaker.gender, ""),
          addressee_names: [addr IN addressees | COALESCE(addr.name, "")],
          addressee_genders: [addr IN addressees | COALESCE(addr.gender, "")],
          chapter_number: chapNum
        }) AS relatedPoems
      }

      //get messenger poems 
      CALL {
        WITH c
        MATCH (poem:Genji_Poem)<-[:MESSENGER_OF]-(c)
        OPTIONAL MATCH (poem)-[:INCLUDED_IN]->(chapter:Chapter)
        OPTIONAL MATCH (poem)<-[:SPEAKER_OF]-(speaker:Character)
        OPTIONAL MATCH (poem)<-[:ADDRESSEE_OF]-(addressee:Character)
        WHERE poem IS NOT NULL AND poem.pnum IS NOT NULL AND chapter.chapter_number IS NOT NULL
        WITH poem, chapter.chapter_number AS chapNum,
            speaker, collect(DISTINCT addressee) as addressees,
            toInteger(apoc.text.regexGroups(poem.pnum, '\\d+$')[0][0]) AS pnumInt
        ORDER BY chapNum ASC, pnumInt ASC
        RETURN collect(DISTINCT {
          pnum: poem.pnum,
          Japanese: poem.Japanese,
          Romaji: poem.Romaji,
          speaker_name: COALESCE(speaker.name, ""),
          speaker_gender: COALESCE(speaker.gender, ""),
          addressee_names: [addr IN addressees | COALESCE(addr.name, "")],
          addressee_genders: [addr IN addressees | COALESCE(addr.gender, "")],
          chapter_number: chapNum
        }) AS messengerPoems
      }

      // All character names
      OPTIONAL MATCH (all:Character)
      WITH c, relatedCharacters, nicknames, relatedPoems, messengerPoems,
          collect(DISTINCT all.name) AS allCharacterNamesRaw

      RETURN c AS character,
            apoc.coll.sort(allCharacterNamesRaw) AS allCharacterNames,
            relatedCharacters,
            relatedPoems,
            messengerPoems,
            nicknames
    `;
    
    const res = await session.readTransaction(tx => tx.run(query, { name }));
    await session.close();
    
    // Format and return the data
    if (res.records.length > 0) {
      const record = res.records[0];
      const character = toNativeTypes(record.get('character').properties);
      const relatedCharacters = toNativeTypes(record.get('relatedCharacters'));
      const relatedPoems = toNativeTypes(record.get('relatedPoems'));
      const allCharacterNames = toNativeTypes(record.get('allCharacterNames'));
      const nicknames = toNativeTypes(record.get('nicknames'));
      const messengerPoems = toNativeTypes(record.get('messengerPoems'));

      return { character, relatedCharacters, relatedPoems, messengerPoems, allCharacterNames, nicknames };
    } else {
      console.log(`No character data returned for: ${name}`);
      return null;
    }
  } catch (error) {
    console.error(`Error in getCharacterData: ${error}`);
    return { "error": "Error in getCharacterData()", "message": error.toString() };
  }
}

// Export data from API endpoint
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');
  
  if (!name) {
    console.log('No character name provided in request');
    return new Response(JSON.stringify({ message: 'Character name is required' }), { status: 400 });
  }
  
  try {
    const data = await getCharacterData(name);
    
    if (data) {
      return new Response(JSON.stringify(data), { status: 200 });
    } else {
      console.log(`Character not found: ${name}`);
      return new Response(JSON.stringify({ message: 'Character not found' }), { status: 404 });
    }
  } catch (error) {
    console.error(`API error: ${error}`);
    return new Response(JSON.stringify({ error: "Error in API", message: error.toString() }), { status: 500 });
  }
}