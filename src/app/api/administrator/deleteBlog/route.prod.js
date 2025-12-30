const { getSession } = require('../../neo4j_driver/route.prod.js');
import { auth } from "../../../../auth.prod";
import { deleteBlogImageDirectory } from '../../blog/imageTools/route.prod';

async function deleteBlog(title) {
  const session = await getSession();

  try {
    // Delete the blog and all its relationships
    const result = await session.writeTransaction(tx => 
      tx.run(
        'MATCH (b:Blog {title: $title}) DETACH DELETE b RETURN count(b) as deletedCount',
        { title }
      )
    );
    
    const deletedCount = result.records[0]?.get('deletedCount').toInt() || 0;
    
    if (deletedCount === 0) {
      throw new Error('Blog not found');
    }
    
    return { success: true };
  } catch(error) {
    console.error('Failed to delete blog:', error);
    throw error;
  } finally {
    await session.close();
  }
}

// delete blog image directory when blog is deleted
async function deleteBlogImageDirectoryWrapper(title) {
  try {
    await deleteBlogImageDirectory(title);
  } catch(error) {
    console.error('Failed to delete blog image directory:', error);
    throw error;
  }
}
  
export const DELETE = async (request) => {
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

    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');
    
    if (!title || !title.trim()) {
      return new Response(JSON.stringify({ message: "Title is required" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const result = await deleteBlog(title.trim());
    await deleteBlogImageDirectoryWrapper(title.trim());
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Blog deleted successfully" 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting blog:', error);
    
    let statusCode = 500;
    let message = "Internal server error";
    
    if (error.message === 'Blog not found') {
      statusCode = 404;
      message = error.message;
    }

    if (error.message === 'Failed to delete blog image directory') {
      statusCode = 500;
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
};
