import { join } from 'path';
import { rename, readdir, unlink, stat, rm } from 'fs/promises';

// sanitize blog title for folder name
export function sanitizeBlogTitle(title) {
    return (title || 'default').replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_').substring(0, 100);
}

// Check if folder exists
async function folderExists(path) {
    try {
        const stats = await stat(path);
        return stats.isDirectory();
    } catch {
        return false;
    }
}

// Handle blog title change by renaming the image directory
export async function handleBlogTitleChange(oldTitle, newTitle, content) {
    const imagedir = join(process.cwd(), 'public', 'blog_images');

    const sanitizedOldTitle = sanitizeBlogTitle(oldTitle);
    const sanitizedNewTitle = sanitizeBlogTitle(newTitle);
    const oldDir = join(imagedir, sanitizedOldTitle);
    const newDir = join(imagedir, sanitizedNewTitle);

    // If folder names are the same, no need to rename
    if (sanitizedOldTitle === sanitizedNewTitle) {
        return { sanitizedTitle: sanitizedNewTitle, updatedContent: content };
    }

    if (await folderExists(oldDir)) {
        if (await folderExists(newDir)) {
            // If new directory already exists, move files from old to new
            const files = await readdir(oldDir);
            for (const file of files) {
                const oldFilePath = join(oldDir, file);
                const newFilePath = join(newDir, file);
                const fileStats = await stat(oldFilePath);
                if (fileStats.isFile()) {
                    await rename(oldFilePath, newFilePath);
                }
            }
            // Remove old directory
            await rm(oldDir, { recursive: true, force: true });
        } else {
            // Directly rename the directory
            await rename(oldDir, newDir);
        }
    }

    // update image urls in content to use new title
    const updatedContent = content.split(`/blog_images/${sanitizedOldTitle}/`).join(`/blog_images/${sanitizedNewTitle}/`);
    return { sanitizedTitle: sanitizedNewTitle, updatedContent: updatedContent };
}

// delete unused images from blog image directory when blog is updated
export async function deleteUnusedImages(title, content) {
    const sanitizedTitle = sanitizeBlogTitle(title);
    const dir = join(process.cwd(), 'public', 'blog_images', sanitizedTitle);

    if (!(await folderExists(dir))) {
        return;
    }

    try {
        // Extract all image filenames from content
        // Match patterns like: /blog_images/{sanitizedTitle}/{filename}
        const escapedTitle = sanitizedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`/blog_images/${escapedTitle}/([^"')\\s<>]+)`, 'g');
        const usedFiles = new Set();
        
        let match;
        while ((match = regex.exec(content)) !== null) {
            const filename = match[1];
            // Remove query parameters or anchors
            const cleanFilename = filename.split('?')[0].split('#')[0];
            if (cleanFilename) {
                usedFiles.add(cleanFilename);
            }
        }

        // Get all files in directory
        const files = await readdir(dir);

        // Delete files that are not in used files
        for (const file of files) {
            if (!usedFiles.has(file)) {
                try {
                    const filePath = join(dir, file);
                    const fileStat = await stat(filePath);
                    if (fileStat.isFile()) { 
                        await unlink(filePath);
                        console.log(`Deleted unused file: ${filePath}`);
                    }
                } catch (error) {
                    console.error(`Failed to delete file ${filePath}:`, error);
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
    const dir = join(process.cwd(), 'public', 'blog_images', sanitizedTitle);

    if (await folderExists(dir)) {
        try {
            await rm(dir, { recursive: true, force: true });
            console.log(`Deleted blog images folder: ${dir}`);
        } catch (error) {
            console.error('Failed to delete blog image directory:', error);
            throw error;
        }
    }
}