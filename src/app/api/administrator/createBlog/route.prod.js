const { getSession } = require('../../neo4j_driver/route.prod.js');
import { withAdminAuth } from "../../../../lib/auth-utils";

async function createBlog(title, content, userEmail, showOnPage = false) {
  const session = await getSession();

  try {
    // Check if blog with same title already exists
    const existingResult = await session.readTransaction(tx => 
      tx.run(
        'MATCH (b:Blog {title: $title}) RETURN b',
        { title }
      )
    );

    if (existingResult.records.length > 0) {
      throw new Error(`A blog with the title "${title}" already exists. Please choose a different title. Each blog must have a unique title.`);
    }

    // Create the blog
    const createResult = await session.writeTransaction(tx => 
      tx.run(
        'CREATE (b:Blog {title: $title, content: $content, showOnPage: $showOnPage}) RETURN b',
        { title, content, showOnPage }
      )
    );

    if (createResult.records.length === 0) {
      throw new Error('Failed to create blog');
    }

    // If user email is provided, create relationship to author
    if (userEmail) {
      await session.writeTransaction(tx => 
        tx.run(
          `MATCH (b:Blog {title: $title})
           MATCH (p:People {email: $userEmail})
           CREATE (p)-[:AUTHOR_OF]->(b)`,
          { title, userEmail }
        )
      );
    }
    
    return { success: true };
  } catch(error) {
    console.error('Failed to create blog:', error);
    throw error;
  } finally {
    await session.close();
  }
}

export const POST = withAdminAuth(async (request, session) => {
  try {
    const { title, content, showOnPage = false } = await request.json();
    
    if (!title || !title.trim()) {
      return new Response(JSON.stringify({ message: "Title is required" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (content === undefined) {
      return new Response(JSON.stringify({ message: "Content is required" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const result = await createBlog(title.trim(), content, session.user.email, showOnPage);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Blog created successfully" 
    }), { 
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating blog:', error);
    
    let statusCode = 500;
    let message = "Internal server error";
    
    if (error.message.includes('already exists')) {
      statusCode = 409;
      message = "Blog title conflict";
    }
    
    return new Response(JSON.stringify({ 
      success: false,
      message: message,
      error: error.message 
    }), { 
      status: statusCode,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
