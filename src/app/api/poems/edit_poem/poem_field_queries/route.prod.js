import { getSession } from '../../../neo4j_driver/route.prod.js';
import { checkServerSideAdmin } from '../../../../../lib/auth-utils';

// Frontend field name -> actual Neo4j property name.
// Only plain SET-able properties belong here. Fields that are really
// relationships (age, season, speaker, places, etc.) get their own
// dedicated handler below and must NOT be added to this map.
const SCALAR_FIELD_MAP = {
  paperMediumType: 'paper_or_medium_type',
  deliveryStyle: 'delivery_style',
  handwritingDescription: 'handwriting_description',
  narrativeContext: 'narrative_context',
  paraphrase: 'paraphrase',
  notes: 'notes',
};
const VALID_SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'];

const CHARACTER_RELATION_MAP = {
  messenger: 'MESSENGER_OF',
  proxy: 'PROXY_POET_OF',
  speaker: 'SPEAKER_OF',
};

const VALID_POETIC_TECHNIQUES = [
  'kakekotoba',
  'engo',
  'utamakura',
  'makurakotoba',
];
const VALID_POEM_TYPES = [
    'Proffered Poem',
    'Reply Poem',
    'Soliloquy',
    'Group Poem'
];

const ALL_POEM_TYPES = [
    "Character Name Poem",
    "Soliloquy",
    "Proxy Poem",
    "Group Poem",
    "Reply Poem",
    "Proffered Poem",
    "Morning After Poem",
    "Inset on the page by Waley",
    "Omitted by Seidensticker",
    "Bad Poems",
    "Mourning Poem",
    "Omitted By Waley",
    "Contain_a_Pronoun",
    "Contain_a_Pronoun",
    "Contain_a_Person_Noun",
    "Contain_a_Person_Noun",
    "no reply",
    "unmatched",
    "Spirit Posession Poem"
];

const EDITABLE_PW_FIELDS = ['kanji_hiragana', 'name', 'english_equiv', 'gloss'];

async function updateScalarProperty(pnum, field, value ) {
  const propName = SCALAR_FIELD_MAP[field];
  if (!propName) {
    throw new Error(`Field "${field}" is not editable via updateScalarProperty`);
  }

  const session = await getSession();
  try {
    // propName comes only from our fixed map above, never from raw
    // user input, so it's safe to interpolate into the SET clause.
    const result = await session.run(
      `MATCH (g:Genji_Poem {pnum: $pnum})
       SET g.${propName} = $value, g.last_updated = datetime()
       RETURN g`,
      { pnum: pnum.toString(), value: value || null }
    );

    if (result.records.length === 0) {
      throw new Error(`No poem found with pnum ${pnum}`);
    }
    return result.records[0].get('g').properties;
  } finally {
    await session.close();
  }
}

async function updateSeason(pnum, value) {
  const session = await getSession();
  try {
    await session.run(
      `MATCH (g:Genji_Poem {pnum: $pnum})-[r:IN_SEASON_OF]->(:Season) DELETE r`,
      { pnum: pnum.toString() }
    );

    const trimmed = (value ?? '').toString().trim();
    if (!trimmed) return { pnum, season: null };

    if (!VALID_SEASONS.includes(trimmed)) {
      throw new Error(`Invalid season: ${trimmed}`);
    }

    await session.run(
      `MATCH (g:Genji_Poem {pnum: $pnum})
       MATCH (s:Season {name: $season})
       CREATE (g)-[r:IN_SEASON_OF]->(s)`,
      { pnum: pnum.toString(), season: trimmed }
    );

    return { pnum, season: trimmed };
  } finally {
    await session.close();
  }
}

async function updateCharacterRelation(pnum, relType, value) {
  const session = await getSession();
  try {
    await session.run(
      `MATCH (c:Character)-[r:${relType}]->(g:Genji_Poem {pnum: $pnum}) DELETE r`,
      { pnum: pnum.toString() }
    );

    const name = (value ?? '').toString().trim();
    if (!name) return { pnum, [relType]: null };

    await session.run(`MERGE (c:Character {name: $name})`, { name });
    await session.run(
      `MATCH (g:Genji_Poem {pnum: $pnum})
       MATCH (c:Character {name: $name})
       CREATE (c)-[r:${relType}]->(g)`,
      { pnum: pnum.toString(), name }
    );

    return { pnum, value: name };
  } finally {
    await session.close();
  }
}

async function updateAge(pnum, value) {
  const session = await getSession();
  try {
    // Mirrors the relationship-based age logic from the bulk edit route:
    // age lives on a separate Genji_Age node, not as a plain property.
    await session.run(
      `MATCH (g:Genji_Poem {pnum: $pnum})-[r:AT_GENJI_AGE_OF]->(:Genji_Age)
       DELETE r`,
      { pnum: pnum.toString() }
    );

    const trimmed = (value ?? '').toString().trim();
    if (!trimmed) {
      // Clearing the age: relationship removed above, nothing more to do.
      return { pnum, age: null };
    }

    const ageValue = parseInt(trimmed, 10);
    if (isNaN(ageValue) || ageValue <= 0) {
      throw new Error('Age must be a positive integer');
    }

    await session.run(`MERGE (a:Genji_Age {age: $ageValue})`, { ageValue });

    await session.run(
      `MATCH (g:Genji_Poem {pnum: $pnum})
       MATCH (a:Genji_Age {age: $ageValue})
       CREATE (g)-[r:AT_GENJI_AGE_OF]->(a)`,
      { pnum: pnum.toString(), ageValue }
    );

    return { pnum, age: ageValue };
  } finally {
    await session.close();
  }
}

async function updatePoemType(pnum, value) {
  const selected = Array.isArray(value)
    ? value
        .flatMap(item => {
          if (Array.isArray(item)) {
            return item[1] ? [item[0]] : [];
          }
          return [item];
        })
        .map(item => String(item).trim())
        .filter(Boolean)
    : [];

  const normalized = [...new Set(selected)];

  const invalid = normalized.filter(
    type => !VALID_POEM_TYPES.includes(type)
  );

  if (invalid.length > 0) {
    throw new Error(`Invalid poem type(s): ${invalid.join(', ')}`);
  }

  const session = await getSession();

  try {
    const tx = session.beginTransaction();

    try {
      // Only delete TAGGED_AS edges pointing at poem-type tags — leaves other tags (e.g. "bad poem") untouched
      await tx.run(
        `MATCH (g:Genji_Poem {pnum: $pnum})-[r:TAGGED_AS]->(pt:Tag)
         WHERE pt.Type IN $allPoemTypes
         DELETE r`,
        {
          pnum: pnum.toString(),
          allPoemTypes: VALID_POEM_TYPES,
        }
      );

      if (normalized.length > 0) {
        await tx.run(
          `MATCH (g:Genji_Poem {pnum: $pnum})
           MATCH (pt:Tag)
           WHERE pt.Type IN $types
           MERGE (g)-[:TAGGED_AS]->(pt)`,
          {
            pnum: pnum.toString(),
            types: normalized,
          }
        );
      }

      await tx.run(
        `MATCH (g:Genji_Poem {pnum: $pnum})
         SET g.last_updated = datetime()`,
        { pnum: pnum.toString() }
      );

      await tx.commit();

      return { pnum, poemType: normalized };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  } finally {
    await session.close();
  }
}

async function updatePoeticWordField(pnum, pwId, field, value) {
  if (!EDITABLE_PW_FIELDS.includes(field)) {
    throw new Error(`Invalid poetic word field: ${field}`);
  }

  const session = await getSession();

  try {
    const tx = session.beginTransaction();

    try {
      await tx.run(
        `MATCH (g:Genji_Poem {pnum: $pnum})-[:HAS_POETIC_WORD_OF]->(pw:Poetic_Word {name: $pwId})
         SET pw[$field] = $value`,
        {
          pnum: pnum.toString(),
          pwId: pwId,
          field: field,
          value: value,
        }
      );

      await tx.run(
        `MATCH (g:Genji_Poem {pnum: $pnum})
         SET g.last_updated = datetime()`,
        { pnum: pnum.toString() }
      );

      await tx.commit();

      return { pnum, field, value };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  } finally {
    await session.close();
  }
}

async function updateAllPoemType(pnum, value) {
  const selected = Array.isArray(value)
    ? value
        .flatMap(item => {
          if (Array.isArray(item)) {
            return item[1] ? [item[0]] : [];
          }
          return [item];
        })
        .map(item => String(item).trim())
        .filter(Boolean)
    : [];

  const normalized = [...new Set(selected)];

  const invalid = normalized.filter(
    type => !ALL_POEM_TYPES.includes(type)
  );

  if (invalid.length > 0) {
    throw new Error(`Invalid poem type(s): ${invalid.join(', ')}`);
  }

  const session = await getSession();

  try {
    const tx = session.beginTransaction();

    try {
      // Only delete TAGGED_AS edges pointing at poem-type tags — leaves other tags (e.g. "bad poem") untouched
      await tx.run(
        `MATCH (g:Genji_Poem {pnum: $pnum})-[r:TAGGED_AS]->(pt:Tag)
         WHERE pt.Type IN $allPoemTypes
         DELETE r`,
        {
          pnum: pnum.toString(),
          allPoemTypes: ALL_POEM_TYPES,
        }
      );

      if (normalized.length > 0) {
        await tx.run(
          `MATCH (g:Genji_Poem {pnum: $pnum})
           MATCH (pt:Tag)
           WHERE pt.Type IN $types
           MERGE (g)-[:TAGGED_AS]->(pt)`,
          {
            pnum: pnum.toString(),
            types: normalized,
          }
        );
      }

      await tx.run(
        `MATCH (g:Genji_Poem {pnum: $pnum})
         SET g.last_updated = datetime()`,
        { pnum: pnum.toString() }
      );

      await tx.commit();

      return { pnum, poemType: normalized };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  } finally {
    await session.close();
  }
}

async function updatePoeticTechnique(pnum, value) {
  const selected = Array.isArray(value)
    ? value
        .flatMap(item => {
          // Also accept your existing [name, boolean] format
          if (Array.isArray(item)) {
            return item[1] ? [item[0]] : [];
          }

          return [item];
        })
        .map(item => String(item).trim())
        .filter(Boolean)
    : [];

  const normalized = [...new Set(selected)];

  const invalid = normalized.filter(
    technique => !VALID_POETIC_TECHNIQUES.includes(technique)
  );

  if (invalid.length > 0) {
    throw new Error(
      `Invalid poetic technique(s): ${invalid.join(', ')}`
    );
  }

  const session = await getSession();

  try {
    const tx = session.beginTransaction();

    try {
      // Remove all existing poetic-technique relationships
      await tx.run(
        `MATCH (g:Genji_Poem {pnum: $pnum})
         OPTIONAL MATCH (g)-[r:EMPLOYS_POETIC_TECHNIQUE]->(:Poetic_Technique)
         DELETE r`,
        {
          pnum: pnum.toString(),
        }
      );

      // Recreate relationships for the selected techniques
      if (normalized.length > 0) {
        await tx.run(
          `MATCH (g:Genji_Poem {pnum: $pnum})
           MATCH (pt:Poetic_Technique)
           WHERE pt.name IN $techniques
           MERGE (g)-[:EMPLOYS_POETIC_TECHNIQUE]->(pt)`,
          {
            pnum: pnum.toString(),
            techniques: normalized,
          }
        );
      }

      await tx.run(
        `MATCH (g:Genji_Poem {pnum: $pnum})
         SET g.last_updated = datetime()`,
        {
          pnum: pnum.toString(),
        }
      );

      await tx.commit();

      return {
        pnum,
        poeticTechnique: normalized,
      };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  } finally {
    await session.close();
  }
}


export async function PUT(request) {
  const { isAdmin } = await checkServerSideAdmin();
  if (!isAdmin) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized. Admin access required to edit poems.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { pnum, field, value, pwId } = await request.json();
  if (!pnum || !field) {
    return new Response(
      JSON.stringify({ error: 'pnum and field are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    let updated;
    if (field === 'age') {
      updated = await updateAge(pnum, value);
    } else if (field === 'poeticTechnique') {
      updated = await updatePoeticTechnique(pnum, value);
    } else if (field === 'poemType') {
      updated = await updatePoemType(pnum, value);
    } else if (field === 'poemTypeAll') {
      updated = await updateAllPoemType(pnum, value);
    } else if (SCALAR_FIELD_MAP[field]) {
      updated = await updateScalarProperty(pnum, field, value);
    } else if (EDITABLE_PW_FIELDS.includes(field)) {
      updated = await updatePoeticWordField(pnum, pwId, field, value);
    } else if (field === 'season') {
      updated = await updateSeason(pnum, value);
    }else if (CHARACTER_RELATION_MAP[field]) {
      updated = await updateCharacterRelation(pnum, CHARACTER_RELATION_MAP[field], value);
    } else {
      return new Response(
        JSON.stringify({ error: `Field "${field}" is not editable via this endpoint` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('poem_field_queries PUT error:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}