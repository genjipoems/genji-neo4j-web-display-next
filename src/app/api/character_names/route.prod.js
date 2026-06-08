import { getSession } from '../neo4j_driver/route.prod.js';

export const dynamic = 'force-dynamic';

export const GET = async () => {
  var resGraph;
  try {
    const session = await getSession();
    resGraph = await session.readTransaction(tx => tx.run(
      `
      MATCH (a:Character) 
      RETURN a.name
      ORDER BY toLower(a.name) // This sorts alphabetically in Neo4j
      `
    ));
    resGraph = resGraph.records.map(e => e._fields[0]);
    // console.log(JSON.stringify(resGraph))
  } catch (error) {
    console.log("Failed to get data:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch character data" }), { status: 500 });
  }
  
  // If you prefer sorting in JavaScript instead of in the Cypher query:
  // resGraph.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  
  return new Response(JSON.stringify(resGraph), { status: 200 });
}