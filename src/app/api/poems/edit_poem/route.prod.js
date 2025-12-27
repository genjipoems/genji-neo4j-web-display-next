import { getSession } from '../../neo4j_driver/route.prod.js';
import { checkServerSideAdmin } from '../../../../lib/auth-utils';

// Update (PUT) existing poem
export async function PUT(request) {
  try {
    // Check if user is admin before allowing poem edits
    const { isAdmin } = await checkServerSideAdmin();
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Admin access required to edit poems.' }), 
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { searchParams } = new URL(request.url);
    const pnum = searchParams.get("pnum");

    if (!pnum) {
      return new Response(JSON.stringify({ error: "Missing pnum param" }), { status: 400 });
    }

    const data = await request.json();

    await updatePoemProperties(pnum, data);

    return new Response(JSON.stringify({ message: "Poem updated successfully" }), { status: 200 });
  } catch (error) {
    console.error("PUT error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function DELETE(request) {
  // Check if user is admin before allowing poem field deletions
  const { isAdmin } = await checkServerSideAdmin();
  if (!isAdmin) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized. Admin access required to delete poem fields.' }), 
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const session = await getSession();
  
  try {
    const { searchParams } = new URL(request.url);
    const pnum = searchParams.get("pnum");
    let field = searchParams.get("field");

    if (!pnum || !field) {
      return new Response(JSON.stringify({ error: "Missing pnum or field param" }), { status: 400 });
    }

    // Normalize snake_case and legacy field names to canonical camelCase
    const fieldAliases = {
      other_recipients: "otherRecipients",
      unintended_recipients: "unintendedRecipients",
      group_participants: "groupParticipants",

      // legacy / typo support
      otherRecipient: "otherRecipients",
    };

    field = fieldAliases[field] || field;


    // **Sanitize field name** - expanded to include season, age and other allowed fields
    const allowedFields = ["speaker", "addressee", "addressee2", "addressee3", "Spoken", "Written", "Complete", "season", "age", "paper_or_medium_type", "delivery_style", "season_evidence", "narrative_context", "paraphrase", "notes", "pt", "tag", "otherTags", "placeOfComp", "placeOfReceipt", "placeOfComp_evidence", "placeOfReceipt_evidence", "evidence_for_spoken_or_written", "pw", "messenger", "proxy", "replyPoems", "kigo", "handwriting_description", "otherTranslations", "otherRecipients", "unintendedRecipients", "groupParticipants"];
    if (!allowedFields.includes(field)) {
      return new Response(JSON.stringify({ error: "Invalid field param" }), { status: 400 });
    }

    // Handle speaker deletion specially (remove SPEAKER_OF relationship)
    else if (field === "speaker") {
      const query = `
        MATCH (c:Character)-[r:SPEAKER_OF]->(g:Genji_Poem {pnum: $pnum})
        DELETE r
        RETURN count(r) as deletedCount
      `;
      
      const result = await session.run(query, { pnum });
      
      const deletedCount = result.records[0]?.get("deletedCount")?.toNumber() || 0;
      return new Response(JSON.stringify({ message: `Deleted ${deletedCount} speaker relationships` }), { status: 200 });
    }
    // Handle addressee deletion specially (remove all ADDRESSEE_OF relationships)
    else if (field === "addressee" || field === "addressee2" || field === "addressee3") {
      const query = `
        MATCH (c:Character)-[r:ADDRESSEE_OF]->(g:Genji_Poem {pnum: $pnum})
        DELETE r
        RETURN count(r) as deletedCount
      `;
      
      const result = await session.run(query, { pnum });
      
      const deletedCount = result.records[0]?.get("deletedCount")?.toNumber() || 0;
      return new Response(JSON.stringify({ message: `Deleted ${deletedCount} addressee relationships` }), { status: 200 });
    }

    // Handle other recipient deletion specially (remove OTHER_RECIPIENT_OF relationship)
    else if (field === "otherRecipients") {
      const query = `
        MATCH (c:Character)-[r:OTHER_RECIPIENT_OF]->(g:Genji_Poem {pnum: $pnum})
        DELETE r
        RETURN count(r) as deletedCount
      `;
      
      const result = await session.run(query, { pnum });
      
      const deletedCount = result.records[0]?.get("deletedCount")?.toNumber() || 0;
      return new Response(JSON.stringify({ message: `Deleted ${deletedCount} other recipient relationships` }), { status: 200 });
    }

// Handle unintended recipient deletion specially (remove UNINTENDED_RECIPIENT_OF relationship)
else if (field === "unintendedRecipients") {
  const query = `
    MATCH (c:Character)-[r:UNINTENDED_RECIPIENT_OF]->(g:Genji_Poem {pnum: $pnum})
    DELETE r
    RETURN count(r) as deletedCount
  `;
  
  const result = await session.run(query, { pnum });
  
  const deletedCount = result.records[0]?.get("deletedCount")?.toNumber() || 0;
  return new Response(JSON.stringify({ message: `Deleted ${deletedCount} unintended recipient relationships` }), { status: 200 });
}

// Handle group participant deletion specially (remove GROUP PARTICIPANT_OF relationship)
else if (field === "groupParticipants") {
  const query = `
    MATCH (c:Character)-[r:GROUP_PARTICIPANT_OF]->(g:Genji_Poem {pnum: $pnum})
    DELETE r
    RETURN count(r) as deletedCount
  `;
  
  const result = await session.run(query, { pnum });
  
  const deletedCount = result.records[0]?.get("deletedCount")?.toNumber() || 0;
  return new Response(JSON.stringify({ message: `Deleted ${deletedCount} group participant relationships` }), { status: 200 });
}
    // Handle age deletion specially (remove AT_GENJI_AGE_OF relationship)
    else if (field === "age") {
      const query = `
        MATCH (g:Genji_Poem {pnum: $pnum})-[r:AT_GENJI_AGE_OF]->(a:Genji_Age)
        DELETE r
        RETURN g
      `;
      
      const result = await session.run(query, { pnum });
      
      if (result.records.length > 0) {
        return new Response(JSON.stringify({ message: "Age relationship deleted successfully" }), { status: 200 });
      } else {
        return new Response(JSON.stringify({ message: "No age relationship found to delete" }), { status: 200 });
      }
    }
    // Handle season deletion specially (remove relationship)
    else if (field === "season") {
      const query = `
        MATCH (g:Genji_Poem {pnum: $pnum})-[r:IN_SEASON_OF]->(s:Season)
        DELETE r
        RETURN g
      `;
      
      const result = await session.run(query, { pnum });
      
      if (result.records.length > 0) {
        return new Response(JSON.stringify({ message: "Season relationship deleted successfully" }), { status: 200 });
      } else {
        return new Response(JSON.stringify({ message: "No season relationship found to delete" }), { status: 200 });
      }
    } 
    // Handle season_evidence deletion specially (remove evidence property from relationship)
    else if (field === "season_evidence") {
      const query = `
        MATCH (g:Genji_Poem {pnum: $pnum})-[r:IN_SEASON_OF]->(s:Season)
        REMOVE r.evidence
        RETURN r
      `;
      
      const result = await session.run(query, { pnum });
      
      if (result.records.length > 0) {
        return new Response(JSON.stringify({ message: "Season evidence property deleted successfully" }), { status: 200 });
      } else {
        return new Response(JSON.stringify({ message: "No season relationship found to delete evidence from" }), { status: 200 });
      }
    } 
    // Handle poetic techniques deletion specially (remove all EMPLOYS_POETIC_TECHNIQUE relationships)
    else if (field === "pt") {
      const query = `
        MATCH (g:Genji_Poem {pnum: $pnum})-[r:EMPLOYS_POETIC_TECHNIQUE]->(pt:Poetic_Technique)
        DELETE r
        RETURN count(r) as deletedCount
      `;
      
      const result = await session.run(query, { pnum });
      
      const deletedCount = result.records[0]?.get("deletedCount")?.toNumber() || 0;
      return new Response(JSON.stringify({ message: `Deleted ${deletedCount} poetic technique relationships` }), { status: 200 });
    } 
    // Handle poetic words deletion specially (remove all HAS_POETIC_WORD_OF relationships)
    else if (field === "pw") {
      const query = `
        MATCH (g:Genji_Poem {pnum: $pnum})-[r:HAS_POETIC_WORD_OF]->(pw:Poetic_Word)
        DELETE r
        RETURN count(r) as deletedCount
      `;
      
      const result = await session.run(query, { pnum });
      
      const deletedCount = result.records[0]?.get("deletedCount")?.toNumber() || 0;
      return new Response(JSON.stringify({ message: `Deleted ${deletedCount} poetic word relationships` }), { status: 200 });
    } 
    // Handle seasonal words/kigo deletion specially (remove all HAS_SEASONAL_WORD_OF relationships)
    else if (field === "kigo") {
      const query = `
        MATCH (g:Genji_Poem {pnum: $pnum})-[r:HAS_SEASONAL_WORD_OF]->(sw:Seasonal_Word)
        DELETE r
        RETURN count(r) as deletedCount
      `;
      
      const result = await session.run(query, { pnum });
      
      const deletedCount = result.records[0]?.get("deletedCount")?.toNumber() || 0;
      return new Response(JSON.stringify({ message: `Deleted ${deletedCount} seasonal word relationships` }), { status: 200 });
    } 
    // Handle poem types/tags deletion specially (remove all TAGGED_AS relationships)
    else if (field === "tag") {
      const query = `
        MATCH (g:Genji_Poem {pnum: $pnum})-[r:TAGGED_AS]->(t:Tag)
        WHERE t.Type IN ["Proffered Poem", "Reply Poem", "Soliloquy", "Group Poem"]
        DELETE r
        RETURN count(r) as deletedCount
      `;
      
      const result = await session.run(query, { pnum });
      
      const deletedCount = result.records[0]?.get("deletedCount")?.toNumber() || 0;
      return new Response(JSON.stringify({ message: `Deleted ${deletedCount} poem type relationships` }), { status: 200 });
    } 
    // Handle other tags deletion specially (remove TAGGED_AS relationships for other tag types)
    else if (field === "otherTags") {
      const query = `
        MATCH (g:Genji_Poem {pnum: $pnum})-[r:TAGGED_AS]->(t:Tag)
        WHERE t.Type IN ["Chapter Title Poem", "Character Name Poem", "Bad Poems", "Proxy Poem", "Morning After Poem", "Omitted by Seidensticker"]
        DELETE r
        RETURN count(r) as deletedCount
      `;
      
      const result = await session.run(query, { pnum });
      
      const deletedCount = result.records[0]?.get("deletedCount")?.toNumber() || 0;
      return new Response(JSON.stringify({ message: `Deleted ${deletedCount} other tag relationships` }), { status: 200 });
    } 
    // Handle place of composition deletion specially (remove PLACE_OF_COMPOSITION relationship)
    else if (field === "placeOfComp") {
      const query = `
        MATCH (g:Genji_Poem {pnum: $pnum})-[r:PLACE_OF_COMPOSITION]->(p:Place)
        DELETE r
        RETURN count(r) as deletedCount
      `;
      
      const result = await session.run(query, { pnum });
      
      const deletedCount = result.records[0]?.get("deletedCount")?.toNumber() || 0;
      return new Response(JSON.stringify({ message: `Deleted ${deletedCount} place of composition relationships` }), { status: 200 });
    } 
    // Handle place of receipt deletion specially (remove PLACE_OF_RECEIPT relationship)
    else if (field === "placeOfReceipt") {
      const query = `
        MATCH (g:Genji_Poem {pnum: $pnum})-[r:PLACE_OF_RECEIPT]->(p:Place)
        DELETE r
        RETURN count(r) as deletedCount
      `;
      
      const result = await session.run(query, { pnum });
      
      const deletedCount = result.records[0]?.get("deletedCount")?.toNumber() || 0;
      return new Response(JSON.stringify({ message: `Deleted ${deletedCount} place of receipt relationships` }), { status: 200 });
    } 
    // Handle place evidence deletion specially (remove evidence property from place relationships)
    else if (field === "placeOfComp_evidence") {
      const query = `
        MATCH (g:Genji_Poem {pnum: $pnum})-[r:PLACE_OF_COMPOSITION]->(p:Place)
        REMOVE r.evidence
        RETURN r
      `;
      
      const result = await session.run(query, { pnum });
      
      if (result.records.length > 0) {
        return new Response(JSON.stringify({ message: "Place of composition evidence deleted successfully" }), { status: 200 });
      } else {
        return new Response(JSON.stringify({ message: "No place of composition relationship found to delete evidence from" }), { status: 200 });
      }
    } 
    else if (field === "placeOfReceipt_evidence") {
      const query = `
        MATCH (g:Genji_Poem {pnum: $pnum})-[r:PLACE_OF_RECEIPT]->(p:Place)
        REMOVE r.evidence
        RETURN r
      `;
      
      const result = await session.run(query, { pnum });
      
      if (result.records.length > 0) {
        return new Response(JSON.stringify({ message: "Place of receipt evidence deleted successfully" }), { status: 200 });
      } else {
        return new Response(JSON.stringify({ message: "No place of receipt relationship found to delete evidence from" }), { status: 200 });
      }
    } 
    // Handle messenger deletion specially (remove MESSENGER_OF relationship)
    else if (field === "messenger") {
      const query = `
        MATCH (c:Character)-[r:MESSENGER_OF]->(g:Genji_Poem {pnum: $pnum})
        DELETE r
        RETURN count(r) as deletedCount
      `;
      
      const result = await session.run(query, { pnum });
      
      const deletedCount = result.records[0]?.get("deletedCount")?.toNumber() || 0;
      return new Response(JSON.stringify({ message: `Deleted ${deletedCount} messenger relationships` }), { status: 200 });
    } 
    // Handle proxy deletion specially (remove PROXY_POET_OF relationship)
    else if (field === "proxy") {
      const query = `
        MATCH (c:Character)-[r:PROXY_POET_OF]->(g:Genji_Poem {pnum: $pnum})
        DELETE r
        RETURN count(r) as deletedCount
      `;
      
      const result = await session.run(query, { pnum });
      
      const deletedCount = result.records[0]?.get("deletedCount")?.toNumber() || 0;
      return new Response(JSON.stringify({ message: `Deleted ${deletedCount} proxy relationships` }), { status: 200 });
    } 
    // Handle reply poems deletion specially (remove REPLY_TO relationships)
    else if (field === "replyPoems") {
      const query = `
        MATCH (replyPoem:Genji_Poem)-[r:REPLY_TO]->(g:Genji_Poem {pnum: $pnum})
        DELETE r
        RETURN count(r) as deletedCount
      `;
      
      const result = await session.run(query, { pnum });
      
      const deletedCount = result.records[0]?.get("deletedCount")?.toNumber() || 0;
      return new Response(JSON.stringify({ message: `Deleted ${deletedCount} reply poem relationships` }), { status: 200 });
    } 
    // Handle other translations deletion specially (remove all OTHER_TRANSLATION_OF relationships)
    else if (field === "otherTranslations") {
      const query = `
        MATCH (ot:Other_Translation)-[r:OTHER_TRANSLATION_OF]->(g:Genji_Poem {pnum: $pnum})
        DELETE r
        RETURN count(r) as deletedCount
      `;
      
      const result = await session.run(query, { pnum });
      
      const deletedCount = result.records[0]?.get("deletedCount")?.toNumber() || 0;
      return new Response(JSON.stringify({ message: `Deleted ${deletedCount} other translation relationships` }), { status: 200 });
    } 

    else {
      // Handle other field deletions (remove property)
      const query = `
        MATCH (g:Genji_Poem {pnum: $pnum})
        REMOVE g.\`${field}\`
        RETURN g
      `;

      const result = await session.run(query, { pnum });

      if (result.records.length > 0) {
        return new Response(JSON.stringify({ message: `Field '${field}' deleted successfully` }), { status: 200 });
      } else {
        return new Response(JSON.stringify({ error: "Poem not found" }), { status: 404 });
      }
    }
  } catch (error) {
    console.error("DELETE error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  } finally {
    await session.close();
  }
}

// Optional GET if needed
export async function GET(request) {
  // Check if user is admin before allowing access to poem edit endpoints
  const { isAdmin } = await checkServerSideAdmin();
  if (!isAdmin) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized. Admin access required.' }), 
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(JSON.stringify({ message: "GET method" }), { status: 200 });
}

async function updatePoemProperties(pnum, data) {
  const session = await getSession();

  const translatorMap = {
    Waley: "A",
    Seidensticker: "S",
    Tyler: "T",
    Washburn: "W",  // check if "A" is correct for Washburn in your DB
    Cranston: "C"
  };

  const validSeasons = ["Spring", "Summer", "Autumn", "Winter"];

  try {
    await session.writeTransaction(async (tx) => {
      // 1️⃣ Update main Genji_Poem properties
      const query = `
        MATCH (g:Genji_Poem {pnum: $pnum})
        SET g += $props, g.last_updated = datetime()
        RETURN g, g.pnum as pnum
      `;

      const props = {};

      if (data.deliveryStyle !== undefined) props.delivery_style = data.deliveryStyle || null;
      if (data.spoken_or_written_evidence !== undefined) props.evidence_for_spoken_or_written = data.spoken_or_written_evidence || null;
      // Remove age from direct property updates since it's now handled as a relationship
      if (data.JPRM !== undefined && Array.isArray(data.JPRM)) {
        props.Japanese = data.JPRM[0] || null;
        props.Romaji = data.JPRM[1] || null;
      }
      if (data.narrativeContext !== undefined) props.narrative_context = data.narrativeContext || null;
      if (data.notes !== undefined) props.notes = data.notes || null;
      if (data.paperMediumType !== undefined) props.paper_or_medium_type = data.paperMediumType || null;
      if (data.paraphrase !== undefined) props.paraphrase = data.paraphrase || null;
      if (data.spoken !== undefined) props.Spoken = (data.spoken !== undefined && data.spoken !== null) ? String(data.spoken).toLowerCase() : null;
      if (data.written !== undefined) props.Written = (data.written !== undefined && data.written !== null) ? String(data.written).toLowerCase() : null;
      if (data.complete !== undefined) props.Complete = (data.complete !== undefined && data.complete !== null) ? String(data.complete).toLowerCase() : null;
      if (data.handwritingDescription !== undefined) props.handwriting_description = data.handwritingDescription || null;
      if (data.proxy !== undefined) props.proxy = data.proxy || null;
      if (data.messenger !== undefined) props.messenger = data.messenger || null;
      if (data.repCharacter !== undefined) props.representative_character = data.repCharacter || null;
      if (data.groupPoems !== undefined) props.group_poems = data.groupPoems || null;
      if (data.furtherReadings !== undefined) props.further_readings = data.furtherReadings || null;

      await tx.run(query, { pnum: pnum.toString(), props });

      // 1️⃣b Handle speaker relationship
      if (data.speaker !== undefined) {
        // First, remove any existing speaker relationship
        await tx.run(`
          MATCH (c:Character)-[r:SPEAKER_OF]->(g:Genji_Poem {pnum: $pnum})
          DELETE r
        `, { pnum: pnum.toString() });

        // Then, if a speaker is provided, create new relationship
        if (data.speaker && data.speaker.trim()) {
          const speakerName = data.speaker.trim();
          
          // First check if Character node exists, create if it doesn't
          const checkQuery = `
            MATCH (c:Character {name: $speakerName})
            RETURN c.name as name
          `;
          
          const checkResult = await tx.run(checkQuery, { speakerName });
          
          if (checkResult.records.length === 0) {
            // Create the Character node if it doesn't exist
            await tx.run(`
              CREATE (c:Character {name: $speakerName})
            `, { speakerName });
          }
          
          // Create the relationship
          await tx.run(`
            MATCH (g:Genji_Poem {pnum: $pnum})
            MATCH (c:Character {name: $speakerName})
            CREATE (c)-[r:SPEAKER_OF]->(g)
          `, { 
            pnum: pnum.toString(), 
            speakerName: speakerName
          });
        }
      }

      // 1️⃣c Handle addressees relationships
      if (data.addressees !== undefined) {
        // First, remove all existing addressee relationships
        await tx.run(`
          MATCH (c:Character)-[r:ADDRESSEE_OF]->(g:Genji_Poem {pnum: $pnum})
          DELETE r
        `, { pnum: pnum.toString() });

        // Then, create new relationships for each addressee
        if (Array.isArray(data.addressees)) {
          for (const addresseeName of data.addressees) {
            if (addresseeName && addresseeName.trim()) {
              const cleanName = addresseeName.trim();
              
              // First check if Character node exists, create if it doesn't
              const checkQuery = `
                MATCH (c:Character {name: $addresseeName})
                RETURN c.name as name
              `;
              
              const checkResult = await tx.run(checkQuery, { addresseeName: cleanName });
              
              if (checkResult.records.length === 0) {
                // Create the Character node if it doesn't exist
                await tx.run(`
                  CREATE (c:Character {name: $addresseeName})
                `, { addresseeName: cleanName });
              }
              
              // Create the relationship
              await tx.run(`
                MATCH (g:Genji_Poem {pnum: $pnum})
                MATCH (c:Character {name: $addresseeName})
                CREATE (c)-[r:ADDRESSEE_OF]->(g)
              `, { 
                pnum: pnum.toString(), 
                addresseeName: cleanName
              });
            }
          }
        }
      }

      // 1️⃣d Handle other recipient relationship
      if (data.other_recipients !== undefined) {
        // First, remove any existing other recipient relationship
        await tx.run(`
          MATCH (c:Character)-[r:OTHER_RECIPIENT_OF]->(g:Genji_Poem {pnum: $pnum})
          DELETE r
        `, { pnum: pnum.toString() });

         // Normalize to an array of names
        let otherRecipientNames = [];
        if (Array.isArray(data.other_recipients)) {
          otherRecipientNames = data.other_recipients
            .map((n) => (n || "").trim())
            .filter(Boolean);
        } else if (typeof data.other_recipients === "string") {
          otherRecipientNames = data.other_recipients
            .split(",")
            .map((n) => n.trim())
            .filter(Boolean);
        }

        for (const otherRecipientName of otherRecipientNames) {
          const checkQuery = `
            MATCH (c:Character {name: $otherRecipientName})
            RETURN c.name as name
          `;
          
          const checkResult = await tx.run(checkQuery, { otherRecipientName });
          
          if (checkResult.records.length === 0) {
            // Create the Character node if it doesn't exist
            await tx.run(`
              CREATE (c:Character {name: $otherRecipientName})
            `, { otherRecipientName });
          }
          
          // Create the relationship
          await tx.run(`
            MATCH (g:Genji_Poem {pnum: $pnum})
            MATCH (c:Character {name: $otherRecipientName})
            CREATE (c)-[r:OTHER_RECIPIENT_OF]->(g)
          `, { 
            pnum: pnum.toString(), 
            otherRecipientName: otherRecipientName
          });
        }
      }

       // 1️⃣e Handle unintended recipient relationship
      if (data.unintended_recipients !== undefined) {
        // First, remove any existing unintended recipient relationship
        await tx.run(`
          MATCH (c:Character)-[r:UNINTENDED_RECIPIENT_OF]->(g:Genji_Poem {pnum: $pnum})
          DELETE r
        `, { pnum: pnum.toString() });

         // Normalize to an array of names
        let unintendedRecipientNames = [];
        if (Array.isArray(data.unintended_recipients)) {
          unintendedRecipientNames = data.unintended_recipients
            .map((n) => (n || "").trim())
            .filter(Boolean);
        } else if (typeof data.unintended_recipients === "string") {
          unintendedRecipientNames = data.unintended_recipients
            .split(",")
            .map((n) => n.trim())
            .filter(Boolean);
        }

        for (const unintendedRecipientName of unintendedRecipientNames) {
          const checkQuery = `
            MATCH (c:Character {name: $unintendedRecipientName})
            RETURN c.name as name
          `;
          
          const checkResult = await tx.run(checkQuery, { unintendedRecipientName });
          
          if (checkResult.records.length === 0) {
            // Create the Character node if it doesn't exist
            await tx.run(`
              CREATE (c:Character {name: $unintendedRecipientName})
            `, { unintendedRecipientName });
          }
          
          // Create the relationship
          await tx.run(`
            MATCH (g:Genji_Poem {pnum: $pnum})
            MATCH (c:Character {name: $unintendedRecipientName})
            CREATE (c)-[r:UNINTENDED_RECIPIENT_OF]->(g)
          `, { 
            pnum: pnum.toString(), 
            unintendedRecipientName: unintendedRecipientName
          });
        }
      }

         // 1️⃣f Handle group participant relationship
      if (data.group_participants !== undefined) {
        // First, remove any existing group participant relationship
        await tx.run(`
          MATCH (c:Character)-[r:GROUP_PARTICIPANT_OF]->(g:Genji_Poem {pnum: $pnum})
          DELETE r
        `, { pnum: pnum.toString() });

         // Normalize to an array of names
        let groupParticipantNames = [];
        if (Array.isArray(data.group_participants)) {
          groupParticipantNames = data.group_participants
            .map((n) => (n || "").trim())
            .filter(Boolean);
        } else if (typeof data.group_participants === "string") {
          groupParticipantNames = data.group_participants
            .split(",")
            .map((n) => n.trim())
            .filter(Boolean);
        }

        for (const groupParticipantName of groupParticipantNames) {
          const checkQuery = `
            MATCH (c:Character {name: $groupParticipantName})
            RETURN c.name as name
          `;
          
          const checkResult = await tx.run(checkQuery, { groupParticipantName });
          
          if (checkResult.records.length === 0) {
            // Create the Character node if it doesn't exist
            await tx.run(`
              CREATE (c:Character {name: $groupParticipantName})
            `, { groupParticipantName });
          }
          
          // Create the relationship
          await tx.run(`
            MATCH (g:Genji_Poem {pnum: $pnum})
            MATCH (c:Character {name: $groupParticipantName})
            CREATE (c)-[r:GROUP_PARTICIPANT_OF]->(g)
          `, { 
            pnum: pnum.toString(), 
            groupParticipantName: groupParticipantName
          });
        }
      }
      // 2️⃣ Handle season relationship
      if (data.season !== undefined) {
        // First, remove any existing season relationship
        await tx.run(`
          MATCH (g:Genji_Poem {pnum: $pnum})-[r:IN_SEASON_OF]->(s:Season)
          DELETE r
        `, { pnum: pnum.toString() });

        // Then, if a valid season is provided, create new relationship
        if (data.season && validSeasons.includes(data.season)) {
          // Create relationship with evidence property if provided
          const evidence = data.season_evidence || null;
          
          await tx.run(`
            MATCH (g:Genji_Poem {pnum: $pnum})
            MATCH (s:Season {name: $seasonName})
            CREATE (g)-[r:IN_SEASON_OF]->(s)
            SET r.evidence = $evidence
          `, { 
            pnum: pnum.toString(), 
            seasonName: data.season,
            evidence: evidence
          });
        } else if (data.season && !validSeasons.includes(data.season)) {
          console.warn(`Invalid season provided: ${data.season}. Valid options: ${validSeasons.join(', ')}`);
        }
      }

      // 2️⃣b Handle season_evidence separately (update evidence property on existing relationship)
      if (data.season_evidence !== undefined && data.season === undefined) {
        await tx.run(`
          MATCH (g:Genji_Poem {pnum: $pnum})-[r:IN_SEASON_OF]->(s:Season)
          SET r.evidence = $evidence
        `, { 
          pnum: pnum.toString(),
          evidence: data.season_evidence || null
        });
      }

      // 2️⃣c Handle age relationship
      if (data.age !== undefined) {
        // First, remove any existing age relationship
        await tx.run(`
          MATCH (g:Genji_Poem {pnum: $pnum})-[r:AT_GENJI_AGE_OF]->(a:Genji_Age)
          DELETE r
        `, { pnum: pnum.toString() });

        // Then, if an age is provided, create new relationship
        if (data.age && data.age.toString().trim()) {
          const ageValue = parseInt(data.age.toString().trim());
          
          if (!isNaN(ageValue) && ageValue > 0) {
            // First check if Genji_Age node exists, create if it doesn't
            const checkQuery = `
              MATCH (a:Genji_Age {age: $ageValue})
              RETURN a.age as age
            `;
            
            const checkResult = await tx.run(checkQuery, { ageValue });
            
            if (checkResult.records.length === 0) {
              // Create the Genji_Age node if it doesn't exist
              await tx.run(`
                CREATE (a:Genji_Age {age: $ageValue})
              `, { ageValue });
            }
            
            // Create the relationship
            await tx.run(`
              MATCH (g:Genji_Poem {pnum: $pnum})
              MATCH (a:Genji_Age {age: $ageValue})
              CREATE (g)-[r:AT_GENJI_AGE_OF]->(a)
            `, { 
              pnum: pnum.toString(), 
              ageValue: ageValue
            });
          } else {
            console.warn(`Invalid age provided: ${data.age}. Age must be a positive integer.`);
          }
        }
      }

      // 2️⃣d Handle poetic techniques relationships
      if (data.pt !== undefined) {
        // First, remove all existing poetic technique relationships
        await tx.run(`
          MATCH (g:Genji_Poem {pnum: $pnum})-[r:EMPLOYS_POETIC_TECHNIQUE]->(pt:Poetic_Technique)
          DELETE r
        `, { pnum: pnum.toString() });

        // Parse the pt data and create new relationships for selected techniques
        let ptData = [];
        try {
          ptData = Array.isArray(data.pt) ? data.pt : JSON.parse(data.pt);
        } catch (e) {
          ptData = [];
        }

        if (Array.isArray(ptData)) {
          // Create relationships for techniques that are marked as true
          for (const [techniqueName, isSelected] of ptData) {
            if (isSelected) {
              // First check if the Poetic_Technique node exists
              const checkQuery = `
                MATCH (pt:Poetic_Technique {name: $techniqueName})
                RETURN pt.name as name
              `;
              
              const checkResult = await tx.run(checkQuery, { techniqueName: techniqueName });
              
              if (checkResult.records.length === 0) {
                continue;
              }
              
              // Create the relationship
              await tx.run(`
                MATCH (g:Genji_Poem {pnum: $pnum})
                MATCH (pt:Poetic_Technique {name: $techniqueName})
                CREATE (g)-[r:EMPLOYS_POETIC_TECHNIQUE]->(pt)
              `, { 
                pnum: pnum.toString(), 
                techniqueName: techniqueName
              });
            }
          }
        }
      }

      // 2️⃣e Handle poem types/tags relationships
      if (data.tag !== undefined) {
        // First, remove all existing tag relationships
        await tx.run(`
          MATCH (g:Genji_Poem {pnum: $pnum})-[r:TAGGED_AS]->(t:Tag)
          DELETE r
        `, { pnum: pnum.toString() });

        // Parse the tag data and create new relationships for selected types
        let tagData = [];
        try {
          tagData = Array.isArray(data.tag) ? data.tag : JSON.parse(data.tag);
        } catch (e) {
          tagData = [];
        }

        if (Array.isArray(tagData)) {
          // Create relationships for selected poem types
          for (const typeName of tagData) {
            if (typeName && typeName.trim()) {
              // First check if the Tag node exists
              const checkQuery = `
                MATCH (t:Tag {Type: $typeName})
                RETURN t.Type as type
              `;
              
              const checkResult = await tx.run(checkQuery, { typeName: typeName });
              
              if (checkResult.records.length === 0) {
                // Create the Tag node if it doesn't exist
                await tx.run(`
                  CREATE (t:Tag {Type: $typeName})
                `, { typeName: typeName });
              }
              
              // Create the relationship
              await tx.run(`
                MATCH (g:Genji_Poem {pnum: $pnum})
                MATCH (t:Tag {Type: $typeName})
                CREATE (g)-[r:TAGGED_AS]->(t)
              `, { 
                pnum: pnum.toString(), 
                typeName: typeName
              });
            }
          }
        }
      }

      // 2️⃣f Handle place of composition relationships
      if (data.placeOfComp !== undefined) {
        // First, remove any existing place of composition relationship
        await tx.run(`
          MATCH (g:Genji_Poem {pnum: $pnum})-[r:PLACE_OF_COMPOSITION]->(p:Place)
          DELETE r
        `, { pnum: pnum.toString() });

        // Then, if a place is provided, create new relationship
        if (data.placeOfComp && data.placeOfComp.trim()) {
          const placeName = data.placeOfComp.trim();
          const evidence = data.placeOfComp_evidence || null;
          
          // First check if Place node exists, create if it doesn't
          const checkQuery = `
            MATCH (p:Place {name: $placeName})
            RETURN p.name as name
          `;
          
          const checkResult = await tx.run(checkQuery, { placeName });
          
          if (checkResult.records.length === 0) {
            // Create the Place node if it doesn't exist
            await tx.run(`
              CREATE (p:Place {name: $placeName})
            `, { placeName });
          }
          
          // Create the relationship
          await tx.run(`
            MATCH (g:Genji_Poem {pnum: $pnum})
            MATCH (p:Place {name: $placeName})
            CREATE (g)-[r:PLACE_OF_COMPOSITION]->(p)
            SET r.evidence = $evidence
          `, { 
            pnum: pnum.toString(), 
            placeName: placeName,
            evidence: evidence
          });
        }
      }

      // 2️⃣g Handle place of receipt relationships
      if (data.placeOfReceipt !== undefined) {
        // First, remove any existing place of receipt relationship
        await tx.run(`
          MATCH (g:Genji_Poem {pnum: $pnum})-[r:PLACE_OF_RECEIPT]->(p:Place)
          DELETE r
        `, { pnum: pnum.toString() });

        // Then, if a place is provided, create new relationship
        if (data.placeOfReceipt && data.placeOfReceipt.trim()) {
          const placeName = data.placeOfReceipt.trim();
          const evidence = data.placeOfReceipt_evidence || null;
          
          // First check if Place node exists, create if it doesn't
          const checkQuery = `
            MATCH (p:Place {name: $placeName})
            RETURN p.name as name
          `;
          
          const checkResult = await tx.run(checkQuery, { placeName });
          
          if (checkResult.records.length === 0) {
            // Create the Place node if it doesn't exist
            await tx.run(`
              CREATE (p:Place {name: $placeName})
            `, { placeName });
          }
          
          // Create the relationship
          await tx.run(`
            MATCH (g:Genji_Poem {pnum: $pnum})
            MATCH (p:Place {name: $placeName})
            CREATE (g)-[r:PLACE_OF_RECEIPT]->(p)
            SET r.evidence = $evidence
          `, { 
            pnum: pnum.toString(), 
            placeName: placeName,
            evidence: evidence
          });
        }
      }

      // 2️⃣h Handle place evidence separately (update evidence property on existing relationships)
      if (data.placeOfComp_evidence !== undefined && data.placeOfComp === undefined) {
        await tx.run(`
          MATCH (g:Genji_Poem {pnum: $pnum})-[r:PLACE_OF_COMPOSITION]->(p:Place)
          SET r.evidence = $evidence
        `, { 
          pnum: pnum.toString(),
          evidence: data.placeOfComp_evidence || null
        });
      }

      if (data.placeOfReceipt_evidence !== undefined && data.placeOfReceipt === undefined) {
        await tx.run(`
          MATCH (g:Genji_Poem {pnum: $pnum})-[r:PLACE_OF_RECEIPT]->(p:Place)
          SET r.evidence = $evidence
        `, { 
          pnum: pnum.toString(),
          evidence: data.placeOfReceipt_evidence || null
        });
      }

      // 2️⃣i Handle messenger relationships
      if (data.messenger !== undefined) {
        // First, remove any existing messenger relationship
        await tx.run(`
          MATCH (c:Character)-[r:MESSENGER_OF]->(g:Genji_Poem {pnum: $pnum})
          DELETE r
        `, { pnum: pnum.toString() });

        // Then, if a character is provided, create new relationship
        if (data.messenger && data.messenger.trim()) {
          const characterName = data.messenger.trim();
          
          // First check if Character node exists, create if it doesn't
          const checkQuery = `
            MATCH (c:Character {name: $characterName})
            RETURN c.name as name
          `;
          
          const checkResult = await tx.run(checkQuery, { characterName });
          
          if (checkResult.records.length === 0) {
            // Create the Character node if it doesn't exist
            await tx.run(`
              CREATE (c:Character {name: $characterName})
            `, { characterName });
          }
          
          // Create the relationship
          await tx.run(`
            MATCH (g:Genji_Poem {pnum: $pnum})
            MATCH (c:Character {name: $characterName})
            CREATE (c)-[r:MESSENGER_OF]->(g)
          `, { 
            pnum: pnum.toString(), 
            characterName: characterName
          });
        }
      }

      // 2️⃣j Handle proxy relationships
      if (data.proxy !== undefined) {
        // First, remove any existing proxy relationship
        await tx.run(`
          MATCH (c:Character)-[r:PROXY_POET_OF]->(g:Genji_Poem {pnum: $pnum})
          DELETE r
        `, { pnum: pnum.toString() });

        // Then, if a character is provided, create new relationship
        if (data.proxy && data.proxy.trim()) {
          const characterName = data.proxy.trim();
          
          // First check if Character node exists, create if it doesn't
          const checkQuery = `
            MATCH (c:Character {name: $characterName})
            RETURN c.name as name
          `;
          
          const checkResult = await tx.run(checkQuery, { characterName });
          
          if (checkResult.records.length === 0) {
            // Create the Character node if it doesn't exist
            await tx.run(`
              CREATE (c:Character {name: $characterName})
            `, { characterName });
          }
          
          // Create the relationship
          await tx.run(`
            MATCH (g:Genji_Poem {pnum: $pnum})
            MATCH (c:Character {name: $characterName})
            CREATE (c)-[r:PROXY_POET_OF]->(g)
          `, { 
            pnum: pnum.toString(), 
            characterName: characterName
          });
        }
      }

      // 2️⃣k Handle poetic words relationships
      if (data.pw !== undefined) {
        // First, remove all existing poetic word relationships
        await tx.run(`
          MATCH (g:Genji_Poem {pnum: $pnum})-[r:HAS_POETIC_WORD_OF]->(pw:Poetic_Word)
          DELETE r
        `, { pnum: pnum.toString() });

        // Parse the poetic words data and create new relationships
        let poeticWordsData = [];
        try {
          poeticWordsData = Array.isArray(data.pw) ? data.pw : JSON.parse(data.pw);
        } catch (e) {
          poeticWordsData = [];
        }

        if (Array.isArray(poeticWordsData)) {
          // Create relationships for each poetic word
          for (const poeticWord of poeticWordsData) {
            if (poeticWord && poeticWord.name && poeticWord.name.trim()) {
              const wordName = poeticWord.name.trim();
              
              // First check if the Poetic_Word node exists
              const checkQuery = `
                MATCH (pw:Poetic_Word {name: $wordName})
                RETURN pw.name as name
              `;
              
              const checkResult = await tx.run(checkQuery, { wordName });
              
              if (checkResult.records.length === 0) {
                // Create the Poetic_Word node if it doesn't exist
                await tx.run(`
                  CREATE (pw:Poetic_Word {
                    name: $name,
                    kanji_hiragana: $kanji_hiragana,
                    english_equiv: $english_equiv,
                    gloss: $gloss
                  })
                `, { 
                  name: wordName,
                  kanji_hiragana: poeticWord.kanji_hiragana || null,
                  english_equiv: poeticWord.english_equiv || null,
                  gloss: poeticWord.gloss || null
                });
              } else {
                // Update existing Poetic_Word node with new data if provided
                await tx.run(`
                  MATCH (pw:Poetic_Word {name: $wordName})
                  SET pw.kanji_hiragana = COALESCE($kanji_hiragana, pw.kanji_hiragana),
                      pw.english_equiv = COALESCE($english_equiv, pw.english_equiv),
                      pw.gloss = COALESCE($gloss, pw.gloss)
                `, { 
                  wordName,
                  kanji_hiragana: poeticWord.kanji_hiragana || null,
                  english_equiv: poeticWord.english_equiv || null,
                  gloss: poeticWord.gloss || null
                });
              }
              
              // Create the relationship
              await tx.run(`
                MATCH (g:Genji_Poem {pnum: $pnum})
                MATCH (pw:Poetic_Word {name: $wordName})
                CREATE (g)-[r:HAS_POETIC_WORD_OF]->(pw)
              `, { 
                pnum: pnum.toString(), 
                wordName: wordName
              });
            }
          }
        }
      }

      // 2️⃣l Handle seasonal words/kigo relationships
      if (data.kigo !== undefined) {
        // First, remove all existing seasonal word relationships
        await tx.run(`
          MATCH (g:Genji_Poem {pnum: $pnum})-[r:HAS_SEASONAL_WORD_OF]->(sw:Seasonal_Word)
          DELETE r
        `, { pnum: pnum.toString() });

        // Parse the seasonal words data and create new relationships
        let seasonalWordsData = [];
        try {
          seasonalWordsData = Array.isArray(data.kigo) ? data.kigo : JSON.parse(data.kigo);
        } catch (e) {
          seasonalWordsData = [];
        }

        if (Array.isArray(seasonalWordsData)) {
          // Create relationships for each seasonal word
          for (const seasonalWord of seasonalWordsData) {
            if (seasonalWord && seasonalWord.english && seasonalWord.english.trim()) {
              const englishName = seasonalWord.english.trim();
              const evidence = seasonalWord.evidence || null;
              
              // First check if the Seasonal_Word node exists
              const checkQuery = `
                MATCH (sw:Seasonal_Word {english: $englishName})
                RETURN sw.english as english
              `;
              
              const checkResult = await tx.run(checkQuery, { englishName });
              
              if (checkResult.records.length === 0) {
                // Create the Seasonal_Word node if it doesn't exist
                await tx.run(`
                  CREATE (sw:Seasonal_Word {
                    english: $english,
                    japanese: $japanese
                  })
                `, { 
                  english: englishName,
                  japanese: seasonalWord.japanese || null
                });
              } else {
                // Update existing Seasonal_Word node with new data if provided
                await tx.run(`
                  MATCH (sw:Seasonal_Word {english: $englishName})
                  SET sw.japanese = COALESCE($japanese, sw.japanese)
                `, { 
                  englishName,
                  japanese: seasonalWord.japanese || null
                });
              }
              
              // Create the relationship with evidence property
              await tx.run(`
                MATCH (g:Genji_Poem {pnum: $pnum})
                MATCH (sw:Seasonal_Word {english: $englishName})
                CREATE (g)-[r:HAS_SEASONAL_WORD_OF]->(sw)
                SET r.evidence = $evidence
              `, { 
                pnum: pnum.toString(), 
                englishName: englishName,
                evidence: evidence
              });
            }
          }
        }
      }

      // 2️⃣m Handle reply poems relationships
      if (data.replyPoems !== undefined) {
        // First, remove all existing reply relationships where other poems reply TO this poem
        await tx.run(`
          MATCH (replyPoem:Genji_Poem)-[r:REPLY_TO]->(g:Genji_Poem {pnum: $pnum})
          DELETE r
        `, { pnum: pnum.toString() });

        // Parse the reply poems data and create new relationships
        let replyPoemsData = [];
        try {
          replyPoemsData = Array.isArray(data.replyPoems) ? data.replyPoems : JSON.parse(data.replyPoems);
        } catch (e) {
          replyPoemsData = [];
        }

        if (Array.isArray(replyPoemsData)) {
          // Create REPLY_TO relationships for each reply poem
          for (const [replyPnum, isSelected] of replyPoemsData) {
            if (isSelected && replyPnum && replyPnum.trim()) {
              const replyPoemNum = replyPnum.trim();
              
              // Check if the reply poem exists
              const checkQuery = `
                MATCH (replyPoem:Genji_Poem {pnum: $replyPnum})
                RETURN replyPoem.pnum as pnum
              `;
              
              const checkResult = await tx.run(checkQuery, { replyPnum: replyPoemNum });
              
              if (checkResult.records.length > 0) {
                // Create the REPLY_TO relationship: replyPoem REPLY_TO currentPoem
                await tx.run(`
                  MATCH (replyPoem:Genji_Poem {pnum: $replyPnum})
                  MATCH (currentPoem:Genji_Poem {pnum: $currentPnum})
                  CREATE (replyPoem)-[r:REPLY_TO]->(currentPoem)
                `, { 
                  replyPnum: replyPoemNum,
                  currentPnum: pnum.toString()
                });
              }
            }
          }
        }
      }

      // 2️⃣n Handle other translations relationships
      if (data.otherTranslations !== undefined) {
        // First, remove all existing other translation relationships
        await tx.run(`
          MATCH (ot:Other_Translation)-[r:OTHER_TRANSLATION_OF]->(g:Genji_Poem {pnum: $pnum})
          DELETE r
        `, { pnum: pnum.toString() });

        // Parse the other translations data and create new relationships
        let otherTranslationsData = [];
        try {
          otherTranslationsData = Array.isArray(data.otherTranslations) ? data.otherTranslations : JSON.parse(data.otherTranslations);
        } catch (e) {
          otherTranslationsData = [];
        }

        if (Array.isArray(otherTranslationsData)) {
          // Create relationships for each other translation
          for (const otherTranslation of otherTranslationsData) {
            if (otherTranslation && otherTranslation.name && otherTranslation.name.trim() && otherTranslation.translation && otherTranslation.translation.trim()) {
              const translatorName = otherTranslation.name.trim();
              const translationText = otherTranslation.translation.trim();
              
              // Generate unique ID for this other translation: pnum_translatorLastName
              const translationId = `${pnum}_${translatorName.replace(/\s+/g, '_')}`;
              
              // First check if the Other_Translation node exists
              const checkQuery = `
                MATCH (ot:Other_Translation {id: $translationId})
                RETURN ot.id as id
              `;
              
              const checkResult = await tx.run(checkQuery, { translationId });
              
              if (checkResult.records.length === 0) {
                // Create the Other_Translation node if it doesn't exist
                await tx.run(`
                  CREATE (ot:Other_Translation {
                    id: $translationId,
                    name: $name,
                    translation: $translation
                  })
                `, { 
                  translationId: translationId,
                  name: translatorName,
                  translation: translationText
                });
              } else {
                // Update existing Other_Translation node with new data
                await tx.run(`
                  MATCH (ot:Other_Translation {id: $translationId})
                  SET ot.name = $name,
                      ot.translation = $translation
                `, { 
                  translationId: translationId,
                  name: translatorName,
                  translation: translationText
                });
              }
              
              // Create the relationship
              await tx.run(`
                MATCH (g:Genji_Poem {pnum: $pnum})
                MATCH (ot:Other_Translation {id: $translationId})
                CREATE (ot)-[r:OTHER_TRANSLATION_OF]->(g)
              `, { 
                pnum: pnum.toString(), 
                translationId: translationId
              });
            }
          }
        }
      }

      // 3️⃣ Update each Translation node separately if provided
      for (const [translatorName, letter] of Object.entries(translatorMap)) {
        if (data[translatorName] !== undefined) {
          const translationText = data[translatorName] || null;

          const translationQuery = `
            MATCH (t:Translation {id: $translationId})-[:TRANSLATION_OF]->(g:Genji_Poem {pnum: $pnum})
            SET t.translation = $translationText
            RETURN t.id as id
          `;

          await tx.run(translationQuery, {
            pnum: pnum.toString(),
            translationId: `${pnum}${letter}`,
            translationText
          });
        }
      }
    });
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    await session.close();
  }
}