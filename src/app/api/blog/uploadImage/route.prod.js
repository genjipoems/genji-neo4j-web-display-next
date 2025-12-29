import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');
    const blogTitle = formData.get('blogTitle') || 'default';

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Sanitize blog title for folder name
    const sanitizedTitle = blogTitle
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
      .substring(0, 100);

    // Create directory path: public/blog_images/{blogTitle}/
    const blogImagesDir = join(process.cwd(), 'public', 'blog_images', sanitizedTitle);
    
    await mkdir(blogImagesDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${timestamp}_${randomStr}.${fileExtension}`;
    const filePath = join(blogImagesDir, fileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return URL path
    const imageUrl = `/blog_images/${sanitizedTitle}/${fileName}`;

    return NextResponse.json({ url: imageUrl }, { status: 200 });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}

