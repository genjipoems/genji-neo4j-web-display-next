const { getSession } = require('../../neo4j_driver/route.prod.js');
import { auth } from "../../../../auth.prod";

async function updateBlog(originalTitle, newTitle, content, showOnPage) {
  const session = await getSession();

  try {
    const result = await session.writeTransaction(tx => 
      tx.run(
        'MATCH (b:Blog {title: $originalTitle}) SET b.title = $newTitle, b.content = $content, b.showOnPage = $showOnPage RETURN b',
        { originalTitle, newTitle, content, showOnPage }
      )
    );
    
    if (result.records.length === 0) {
      throw new Error('Blog not found');
    }
    
    return { success: true };
  } catch(error) {
    console.error('Failed to update blog:', error);
    throw new Error('Failed to update blog');
  } finally {
    await session.close();
  }
}

export const POST = async (request) => {
  try {
    // Check if user is authenticated
    const session = await auth();
    if (!session) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user has admin role
    if (session.user.role !== 'admin') {
      return new Response(JSON.stringify({ message: "Forbidden - Admin access required" }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { originalTitle, newTitle, content, showOnPage } = await request.json();
    
    if (!originalTitle || !newTitle || content === undefined) {
      return new Response(JSON.stringify({ message: "originalTitle, newTitle and content are required" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const result = await updateBlog(originalTitle, newTitle, content, showOnPage ?? false);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Blog updated successfully" 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating blog:', error);
    return new Response(JSON.stringify({ 
      message: "Internal server error",
      error: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
