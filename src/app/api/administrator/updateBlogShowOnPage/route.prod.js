const { getSession } = require('../../neo4j_driver/route.prod.js');
import { withAdminAuth } from "../../../../lib/auth-utils";

async function updateBlogShowOnPage(originalTitle, showOnPage) {
  const session = await getSession();

  try {
    const result = await session.writeTransaction(tx => 
      tx.run(
        'MATCH (b:Blog {title: $originalTitle}) SET b.showOnPage = $showOnPage RETURN b',
        { originalTitle, showOnPage }
      )
    );

    if (result.records.length === 0) {
      throw new Error('Blog not found');
    }
    
    return { success: true };
  } catch(error) {
    console.error('Failed to update blog showOnPage property:', error);
    throw error;
  } finally {
    await session.close();
  }
}

export const POST = withAdminAuth(async (request, session) => {
  try {
    const { originalTitle, showOnPage } = await request.json();
    
    if (!originalTitle || !originalTitle.trim()) {
      return new Response(JSON.stringify({ message: "originalTitle is required" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (typeof showOnPage !== 'boolean') {
      return new Response(JSON.stringify({ message: "showOnPage must be a boolean" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const result = await updateBlogShowOnPage(originalTitle.trim(), showOnPage);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Blog showOnPage property updated successfully" 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating blog showOnPage:', error);
    
    let statusCode = 500;
    let message = "Internal server error";
    
    if (error.message === 'Blog not found') {
      statusCode = 404;
      message = error.message;
    }
    
    return new Response(JSON.stringify({ 
      message: message,
      error: error.message 
    }), { 
      status: statusCode,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
