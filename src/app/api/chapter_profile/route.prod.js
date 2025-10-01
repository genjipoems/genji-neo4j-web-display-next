import { getSession } from '../neo4j_driver/route.prod.js';
import { toNativeTypes } from '../neo4j_driver/utils.prod.js';

async function getChapterData(name) {
  try {
    const session = await getSession();
    
    // First, check if chapter exists
    const checkQuery = `
      MATCH (ch:Chapter)
      WHERE toLower(ch.chapter_name) = toLower($name)
      RETURN ch.chapter_name as name
    `;
    
    const checkResult = await session.readTransaction(tx => tx.run(checkQuery, { name }));
    if (checkResult.records.length === 0) {
      console.log(`Chapter "${name}" not found`);
      await session.close();
      return null;
    }

    const query = `
      MATCH (ch:Chapter)
      WHERE toLower(ch.chapter_name) = toLower($name)
      CALL {
        WITH ch
        MATCH (poem:Genji_Poem)-[:INCLUDED_IN]->(ch)
        OPTIONAL MATCH (poem)<-[:SPEAKER_OF]-(speaker:Character)
        OPTIONAL MATCH (poem)<-[:ADDRESSEE_OF]-(addressee:Character)
        WITH poem, speaker, collect(DISTINCT addressee) as addressees
        RETURN poem, speaker, addressees
        ORDER BY toInteger(apoc.text.regexGroups(poem.pnum, '\\d+$')[0][0])
      }
      // Fetching the Nicktitle nodes and their translations
      OPTIONAL MATCH (nt:Nicktitle)-[:TRANSLATION_OF]->(ch)
      RETURN
        ch {
          .chapter_name,
          .chapter_number,
          .kanji
        } AS chapter,
        collect(DISTINCT {
          pnum: poem.pnum,
          Japanese: poem.Japanese,
          Romaji: poem.Romaji,
          speaker_name: COALESCE(speaker.name, ""),
          speaker_gender: COALESCE(speaker.gender, ""),
          addressee_names: [addr IN addressees | COALESCE(addr.name, "")],
          addressee_genders: [addr IN addressees | COALESCE(addr.gender, "")]
        }) AS poems,
        collect(DISTINCT nt.translation) AS nicktitles
    `;
    
    const res = await session.readTransaction(tx => tx.run(query, { name }));
    await session.close();
    
    if (res.records.length > 0) {
      const record = res.records[0];
      const chapter = toNativeTypes(record.get('chapter'));
      const poems = toNativeTypes(record.get('poems'));
      const nicktitles = toNativeTypes(record.get('nicktitles'));

      return { chapter, poems, nicktitles };
    } else {
      console.log(`No data found for chapter: ${name}`);
      return null;
    }

  } catch (error) {
    console.error(`Error in getChapterData: ${error}`);
    return { error: "Error in getChapterData()", message: error.toString() };
  }
}

// API route
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');
  
  if (!name) {
    return new Response(JSON.stringify({ message: 'Chapter name is required' }), { status: 400 });
  }

  try {
    const data = await getChapterData(name);

    if (data) {
      return new Response(JSON.stringify(data), { status: 200 });
    } else {
      return new Response(JSON.stringify({ message: 'Chapter not found' }), { status: 404 });
    }

  } catch (error) {
    console.error(`API error: ${error}`);
    return new Response(JSON.stringify({ error: "Error in API", message: error.toString() }), { status: 500 });
  }
}
