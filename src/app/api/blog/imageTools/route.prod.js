import { list, del, put } from '@vercel/blob';

// sanitize blog title for folder name
export function sanitizeBlogTitle(title) {
    return (title || 'default').replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_').substring(0, 100);
}

// List all blobs with a given prefix
async function listBlobsByPrefix(prefix) {
    const { blobs } = await list({ prefix });
    return blobs;
}

// Handle blog title change by renaming the image directory
export async function handleBlogTitleChange(oldTitle, newTitle, content) {
    const sanitizedOldTitle = sanitizeBlogTitle(oldTitle);
    const sanitizedNewTitle = sanitizeBlogTitle(newTitle);
    const oldPrefix = `blog_images/${sanitizedOldTitle}/`;
    const newPrefix = `blog_images/${sanitizedNewTitle}/`;

    // If folder names are the same, no need to rename
    if (sanitizedOldTitle === sanitizedNewTitle) {
        return { sanitizedTitle: sanitizedNewTitle, updatedContent: content };
    }

    // Map to store old URL -> new URL mappings
    const urlMapping = new Map();

    try {
        // List all blobs in the old directory
        const oldBlobs = await listBlobsByPrefix(oldPrefix);

        if (oldBlobs.length > 0) {
            // Copy all files from old directory to new directory
            for (const blob of oldBlobs) {
                const fileName = blob.pathname.split('/').pop();
                const newPath = `${newPrefix}${fileName}`;

                try {
                    // Fetch the old blob content
                    const response = await fetch(blob.url);
                    if (!response.ok) {
                        console.error(`Failed to fetch blob ${blob.url}: ${response.statusText}`);
                        continue;
                    }
                    const buffer = await response.arrayBuffer();

                    // Upload to new location and get new URL
                    const newBlob = await put(newPath, buffer, {
                        access: 'public',
                        contentType: blob.contentType || 'image/jpeg',
                    });

                    // Store mapping: old URL -> new URL
                    urlMapping.set(blob.url, newBlob.url);

                    // Delete old blob
                    await del(blob.url);
                } catch (error) {
                    console.error(`Error moving blob ${blob.url}:`, error);
                    // Continue with other files even if one fails
                }
            }
        }
    } catch (error) {
        console.error('Error handling blog title change:', error);
        // Continue even if blob operations fail, just update the content URLs
    }

    // Update image URLs in content to use new title
    // Handle both relative paths (/blog_images/...) and full blob URLs
    let updatedContent = content;
    
    // Replace full blob URLs first (if any were moved)
    for (const [oldUrl, newUrl] of urlMapping.entries()) {
        updatedContent = updatedContent.split(oldUrl).join(newUrl);
    }
    
    // Replace relative paths
    updatedContent = updatedContent.split(`/blog_images/${sanitizedOldTitle}/`).join(`/blog_images/${sanitizedNewTitle}/`);
    
    // Replace full blob URLs that weren't in the mapping (in case of partial failures)
    // Pattern: https://*.public.blob.vercel-storage.com/blog_images/{oldTitle}/...
    const blobUrlPattern = new RegExp(`(https://[^/]+/blog_images/)${sanitizedOldTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/`, 'g');
    updatedContent = updatedContent.replace(blobUrlPattern, `$1${sanitizedNewTitle}/`);

    return { sanitizedTitle: sanitizedNewTitle, updatedContent: updatedContent };
}

// delete unused images from blog image directory when blog is updated
export async function deleteUnusedImages(title, content) {
    const sanitizedTitle = sanitizeBlogTitle(title);
    const prefix = `blog_images/${sanitizedTitle}/`;

    try {
        // Extract all image filenames from content
        // Match patterns like: /blog_images/{sanitizedTitle}/{filename} or full blob URLs
        const escapedTitle = sanitizedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const usedFiles = new Set();
        
        // Match relative paths: /blog_images/{title}/{filename}
        const relativePathRegex = new RegExp(`/blog_images/${escapedTitle}/([^"')\\s<>]+)`, 'g');
        let match;
        while ((match = relativePathRegex.exec(content)) !== null) {
            const filename = match[1];
            // Remove query parameters or anchors
            const cleanFilename = filename.split('?')[0].split('#')[0];
            if (cleanFilename) {
                usedFiles.add(cleanFilename);
            }
        }

        // Match full blob URLs
        const blobUrlRegex = new RegExp(`https://[^/]+/blog_images/${escapedTitle}/([^"')\\s<>]+)`, 'g');
        while ((match = blobUrlRegex.exec(content)) !== null) {
            const filename = match[1];
            const cleanFilename = filename.split('?')[0].split('#')[0];
            if (cleanFilename) {
                usedFiles.add(cleanFilename);
            }
        }

        // Get all blobs in the directory
        const blobs = await listBlobsByPrefix(prefix);

        // Delete blobs that are not in used files
        for (const blob of blobs) {
            const filename = blob.pathname.split('/').pop();
            if (!usedFiles.has(filename)) {
                try {
                    await del(blob.url);
                    console.log(`Deleted unused blob: ${blob.url}`);
                } catch (error) {
                    console.error(`Failed to delete blob ${blob.url}:`, error);
                    // Don't throw, continue with other files
                }
            }
        }
        console.log('Unused images cleanup completed');
    } catch (error) {
        console.error('Failed to delete unused images:', error);
        throw error;
    }
}

// delete blog image directory when blog is deleted
export async function deleteBlogImageDirectory(title) {
    const sanitizedTitle = sanitizeBlogTitle(title);
    const prefix = `blog_images/${sanitizedTitle}/`;

    try {
        // List all blobs in the directory
        const blobs = await listBlobsByPrefix(prefix);

        if (blobs.length > 0) {
            // Delete all blobs
            for (const blob of blobs) {
                try {
                    await del(blob.url);
                    console.log(`Deleted blob: ${blob.url}`);
                } catch (error) {
                    console.error(`Failed to delete blob ${blob.url}:`, error);
                }
            }
            console.log(`Deleted blog images folder: ${prefix}`);
        }
    } catch (error) {
        console.error('Failed to delete blog image directory:', error);
        throw error;
    }
}