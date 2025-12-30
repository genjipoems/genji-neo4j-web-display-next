const { getSession } = require('../../neo4j_driver/route.prod.js');
import { auth } from "../../../../auth.prod";
import { handleBlogTitleChange, deleteUnusedImages } from '../../blog/imageTools/route.prod';

async function updateBlog(originalTitle, newTitle, content, showOnPage) {
  const session = await getSession();

  try {
    // If title is being changed, check if new title already exists
    // Note: This check is also done in POST handler before image processing
    // This is a double-check for safety
    if (originalTitle !== newTitle) {
      const existingResult = await session.readTransaction(tx => 
        tx.run(
          'MATCH (b:Blog {title: $newTitle}) RETURN b',
          { newTitle }
        )
      );

      if (existingResult.records.length > 0) {
        throw new Error(`A blog with the title "${newTitle}" already exists. Please choose a different title.`);
      }
    }

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
    throw error;
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

    // check if new title conflicts with existing blog
    if (originalTitle !== newTitle) {
      const dbSession = await getSession();
      try {
        const existingResult = await dbSession.readTransaction(tx => 
          tx.run(
            'MATCH (b:Blog {title: $newTitle}) RETURN b',
            { newTitle }
          )
        );
        if (existingResult.records.length > 0) {
          return new Response(JSON.stringify({ 
            success: false,
            message: "Blog title conflict",
            error: `A blog with the title "${newTitle}" already exists. Please choose a different title. Each blog must have a unique title.`
          }), { 
            status: 409,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (error) {
        console.error('Error checking blog title:', error);
      } finally {
        await dbSession.close();
      }
    }
    
    // handle blog title change (rename folder and update content URLs)
    const { sanitizedTitle, updatedContent } = await handleBlogTitleChange(originalTitle, newTitle, content);
    
    // cleanup unused images
    await deleteUnusedImages(newTitle, updatedContent);
    
    // update the blog in database with the updated content
    const result = await updateBlog(originalTitle, newTitle, updatedContent, showOnPage ?? false);


    return new Response(JSON.stringify({ 
      success: true, 
      message: "Blog updated successfully" 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating blog:', error);
    
    let statusCode = 500;
    let message = "Internal server error";
    
    if (error.message.includes('already exists')) {
      statusCode = 409;
      message = "Blog title conflict";
    } else if (error.message === 'Blog not found') {
      statusCode = 404;
      message = "Blog not found";
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
};
