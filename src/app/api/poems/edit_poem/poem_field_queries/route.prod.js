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
  spokenwrittenevidence: 'evidence_for_spoken_or_written',
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

const VALID_SPOKEN_WRITTEN = [
  'Spoken',
  'Written'
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
async function updatecompevidence(pnum, value ) {

  const session = await getSession();
  try {
    // propName comes only from our fixed map above, never from raw
    // user input, so it's safe to interpolate into the SET clause.
    const result = await session.run(
      `MATCH (g:Genji_Poem {pnum: $pnum})-[r:PLACE_OF_COMPOSITION]->(p:Place)
       SET r.evidence = $value, g.last_updated = datetime()
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

async function updaterecevidence(pnum, value ) {

  const session = await getSession();
  try {
    // propName comes only from our fixed map above, never from raw
    // user input, so it's safe to interpolate into the SET clause.
    const result = await session.run(
      `MATCH (g:Genji_Poem {pnum: $pnum})-[r:PLACE_OF_RECEIPT]->(p:Place)
       SET r.evidence = $value, g.last_updated = datetime()
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
async function updateSpokenWritten(pnum, { spoken, written }) {
  if (typeof spoken !== 'boolean' || typeof written !== 'boolean') {
    throw new Error('spoken and written must be booleans');
  }
  const session = await getSession();
  try {
    const result = await session.run(
      `MATCH (g:Genji_Poem {pnum: $pnum})
       SET g.spoken = $spoken,
           g.written = $written,
           g.last_updated = datetime()
       RETURN g`,
      {
        pnum: pnum.toString(),
        spoken: String(spoken),    // 'true' / 'false'
        written: String(written),
      }
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
const normalizeWs = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

// Tiptap sends HTML; plain fields (poet, honka text, order) should be stored as text.
const htmlToPlain = (s) => String(s ?? '')
  .replace(/<\/p>\s*<p>/gi, '\n')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
  .trim();

// Frontend sends honka whitespace-normalized, so match in JS rather than in Cypher.
async function findHonkaId(tx, pnum, honka) {
  const res = await tx.run(
    `MATCH (:Genji_Poem {pnum: $pnum})-[:ALLUDES_TO]->(h:Honka)
     RETURN elementId(h) AS id, h.Honka AS text`,
    { pnum: pnum.toString() }
  );
  const target = normalizeWs(honka);
  const hit = res.records.find(r => normalizeWs(r.get('text')) === target);
  if (!hit) throw new Error('Allusion not found for this poem');
  return hit.get('id');
}

// Shared wrapper: find the honka, run the edit, bump last_updated, commit/rollback.
async function runAllusionEdit(pnum, honka, work) {
  if (!honka) throw new Error('honka is required');
  const session = await getSession();
  try {
    const tx = session.beginTransaction();
    try {
      const id = await findHonkaId(tx, pnum, honka);
      const result = await work(tx, id);
      await tx.run(
        `MATCH (g:Genji_Poem {pnum: $pnum}) SET g.last_updated = datetime()`,
        { pnum: pnum.toString() }
      );
      await tx.commit();
      return result;
    } catch (e) {
      await tx.rollback();
      throw e;
    }
  } finally {
    await session.close();
  }
}

const updateAllusionHonka = (pnum, honka, value) =>
  runAllusionEdit(pnum, honka, async (tx, id) => {
    const text = htmlToPlain(value);
    if (!text) throw new Error('Original text cannot be empty');
    await tx.run(`MATCH (h:Honka) WHERE elementId(h) = $id SET h.Honka = $text`, { id, text });
    return { pnum, field: 'allusionHonka', value: text };
  });

const updateAllusionPoet = (pnum, honka, value) =>
  runAllusionEdit(pnum, honka, async (tx, id) => {
    const name = htmlToPlain(value);
    if (!name) throw new Error('Poet name cannot be empty');
    await tx.run(
      `MATCH (h:Honka) WHERE elementId(h) = $id
       OPTIONAL MATCH (:People)-[old:AUTHOR_OF]->(h)
       MERGE (p:People {name: $name})
       CREATE (p)-[r:AUTHOR_OF]->(h)
       SET r += CASE WHEN old IS NULL THEN {} ELSE properties(old) END
       DELETE old`,
      { id, name }
    );
    return { pnum, field: 'allusionPoet', value: name };
  });

const updateAllusionTranslation = (pnum, honka, translator, value) =>
  runAllusionEdit(pnum, honka, async (tx, id) => {
    if (!translator) throw new Error('translator is required');
    const res = await tx.run(
      `MATCH (h:Honka)<-[:TRANSLATION_OF]-(t:Translation)<-[:TRANSLATOR_OF]-(:People {name: $translator})
       WHERE elementId(h) = $id
       SET t.translation = $value
       RETURN count(t) AS n`,
      { id, translator, value: value || null }
    );
    if (res.records[0].get('n').toNumber() === 0) {
      throw new Error(`No translation by ${translator} found`);
    }
    return { pnum, field: 'allusionTranslation', value };
  });

const updateAllusionOrder = (pnum, honka, sourceTitle, oldOrder, value) =>
  runAllusionEdit(pnum, honka, async (tx, id) => {
    if (!sourceTitle) throw new Error('sourceTitle is required');
    const res = await tx.run(
      `MATCH (h:Honka)-[r:ANTHOLOGIZED_IN]->(s:Source {title: $title})
       WHERE elementId(h) = $id AND toString(coalesce(r.order, '')) = $oldOrder
       SET r.order = $value
       RETURN count(r) AS n`,
      { id, title: sourceTitle, oldOrder: String(oldOrder ?? ''), value: htmlToPlain(value) || null }
    );
    if (res.records[0].get('n').toNumber() === 0) {
      throw new Error('Source entry not found');
    }
    return { pnum, field: 'allusionOrder', value: htmlToPlain(value) };
  });

export async function PUT(request) {
  const { isAdmin } = await checkServerSideAdmin();
  if (!isAdmin) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized. Admin access required to edit poems.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { pnum, field, value, pwId, honka, translator, sourceTitle, oldOrder } = await request.json();  if (!pnum || !field) {
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
    } else if (field === 'spokenwritten') {
      const spoken = VALID_SPOKEN_WRITTEN.includes('Spoken');
      const written = VALID_SPOKEN_WRITTEN.includes('Written');
      updated = await updateSpokenWritten(pnum, { spoken, written });
    } else if (field === 'poemType') {
      updated = await updatePoemType(pnum, value);
    } else if (field === 'poemTypeAll') {
      updated = await updateAllPoemType(pnum, value);
    } else if (field === 'compevidence') {
      updated = await updatecompevidence(pnum, value);
    } else if (field === 'recevidence') {
      updated = await updaterecevidence(pnum, value);
    } else if (SCALAR_FIELD_MAP[field]) {
      updated = await updateScalarProperty(pnum, field, value);
    } else if (EDITABLE_PW_FIELDS.includes(field)) {
      updated = await updatePoeticWordField(pnum, pwId, field, value);
    } else if (field === 'allusionHonka') {
      updated = await updateAllusionHonka(pnum, honka, value);
    } else if (field === 'allusionPoet') {
      updated = await updateAllusionPoet(pnum, honka, value);
    } else if (field === 'allusionTranslation') {
      updated = await updateAllusionTranslation(pnum, honka, translator, value);
    } else if (field === 'allusionOrder') {
      updated = await updateAllusionOrder(pnum, honka, sourceTitle, oldOrder, value);
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