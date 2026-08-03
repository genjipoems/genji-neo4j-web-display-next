// app/api/source/edit_source/route.js
import { getSession } from '../../neo4j_driver/route.prod.js';
import { checkServerSideAdmin } from '../../../../lib/auth-utils.js';

export const dynamic = 'force-dynamic';

// Properties that live directly on the :Source node.
// (author is handled separately since it's a relationship to :People)
const EDITABLE_FIELDS = [
  'title',
  'container_title',
  'contributors',
  'formatted_citation',
  'identifier',
  'item_type',
  'locator',
  'on_source_page',
  'publication_year',
  'publisher',
  'reference_title',
  'url',
];

function buildProps(data) {
  const props = {};
  for (const field of EDITABLE_FIELDS) {
    if (data[field] !== undefined) {
      // store empty string as null so cleared fields don't linger
      props[field] = data[field] === '' ? null : data[field];
    }
  }
  return props;
}

async function upsertAuthor(tx, sourceId, authorName) {
  // Remove any existing AUTHOR_OF relationship for this source
  await tx.run(
    `MATCH (a:People)-[r:AUTHOR_OF]->(s:Source {source_id: $sourceId})
     DELETE r`,
    { sourceId }
  );

  const cleanName = (authorName || '').toString().trim();
  if (!cleanName) return; // author cleared entirely

  // Ensure the People node exists, then relate it
  await tx.run(`MERGE (a:People {name: $cleanName})`, { cleanName });
  await tx.run(
    `MATCH (s:Source {source_id: $sourceId})
     MATCH (a:People {name: $cleanName})
     CREATE (a)-[:AUTHOR_OF]->(s)`,
    { sourceId, cleanName }
  );
}

// GET — fetch one source's full data (for populating the edit form)
export async function GET(request) {
  const { isAdmin } = await checkServerSideAdmin();
  if (!isAdmin) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized. Admin access required.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { searchParams } = new URL(request.url);
  const sourceId = searchParams.get('source_id');

  if (!sourceId) {
    return new Response(JSON.stringify({ error: 'Missing source_id param' }), { status: 400 });
  }

  const session = await getSession();
  try {
    const result = await session.readTransaction(tx =>
      tx.run(
        `MATCH (s:Source {source_id: $sourceId})
         OPTIONAL MATCH (a:People)-[:AUTHOR_OF]->(s)
         RETURN s, a.name as author`,
        { sourceId }
      )
    );

    if (result.records.length === 0) {
      return new Response(JSON.stringify({ error: 'Source not found' }), { status: 404 });
    }

    const record = result.records[0];
    const sourceProps = record.get('s').properties;
    const author = record.get('author');

    return new Response(
      JSON.stringify({ ...sourceProps, author: author || '' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('GET source error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  } finally {
    await session.close();
  }
}

// PUT — update an existing source
export async function PUT(request) {
  const { isAdmin } = await checkServerSideAdmin();
  if (!isAdmin) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized. Admin access required.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { searchParams } = new URL(request.url);
  const sourceId = searchParams.get('source_id');

  if (!sourceId) {
    return new Response(JSON.stringify({ error: 'Missing source_id param' }), { status: 400 });
  }

  const data = await request.json();
  const session = await getSession();

  try {
    await session.writeTransaction(async (tx) => {
      const props = buildProps(data);

      await tx.run(
        `MATCH (s:Source {source_id: $sourceId})
         SET s += $props, s.last_updated = datetime()
         RETURN s`,
        { sourceId, props }
      );

      if (data.author !== undefined) {
        await upsertAuthor(tx, sourceId, data.author);
      }
    });

    return new Response(JSON.stringify({ message: 'Source updated successfully' }), { status: 200 });
  } catch (error) {
    console.error('PUT source error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  } finally {
    await session.close();
  }
}

// POST — create a new source
export async function POST(request) {
  const { isAdmin } = await checkServerSideAdmin();
  if (!isAdmin) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized. Admin access required.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const data = await request.json();
  const session = await getSession();

  try {
    const newSourceId = await session.writeTransaction(async (tx) => {
      // Generate the next numeric source_id (based on existing purely-numeric ids)
      const idResult = await tx.run(`
        MATCH (s:Source)
        WHERE s.source_id =~ '^[0-9]+$'
        RETURN max(toInteger(s.source_id)) as maxId
      `);
      const rawMax = idResult.records[0]?.get('maxId');
      const maxId = rawMax == null ? 0 : (typeof rawMax.toNumber === 'function' ? rawMax.toNumber() : rawMax);
      const sourceId = (maxId + 1).toString();

      const props = buildProps(data);
      props.source_id = sourceId;
      if (props.on_source_page === undefined || props.on_source_page === null) {
        props.on_source_page = 'true';
      }

      await tx.run(
        `CREATE (s:Source)
         SET s += $props, s.created_at = datetime(), s.last_updated = datetime()`,
        { props }
      );

      if (data.author !== undefined) {
        await upsertAuthor(tx, sourceId, data.author);
      }

      return sourceId;
    });

    return new Response(
      JSON.stringify({ message: 'Source created successfully', source_id: newSourceId }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('POST source error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  } finally {
    await session.close();
  }
}

// DELETE — remove a source entirely
export async function DELETE(request) {
  const { isAdmin } = await checkServerSideAdmin();
  if (!isAdmin) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized. Admin access required.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { searchParams } = new URL(request.url);
  const sourceId = searchParams.get('source_id');

  if (!sourceId) {
    return new Response(JSON.stringify({ error: 'Missing source_id param' }), { status: 400 });
  }

  const session = await getSession();
  try {
    await session.writeTransaction(tx =>
      tx.run(
        `MATCH (s:Source {source_id: $sourceId})
         DETACH DELETE s`,
        { sourceId }
      )
    );

    return new Response(JSON.stringify({ message: 'Source deleted successfully' }), { status: 200 });
  } catch (error) {
    console.error('DELETE source error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  } finally {
    await session.close();
  }
}