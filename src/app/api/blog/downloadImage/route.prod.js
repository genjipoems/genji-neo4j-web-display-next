import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    // Validate URL
    let url;
    try {
      url = new URL(imageUrl);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return NextResponse.json({ error: 'Only HTTP and HTTPS URLs are allowed' }, { status: 400 });
    }

    // Fetch the image from the server
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    // Check if it's an image
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'URL does not point to an image' }, { status: 400 });
    }

    // Get the image as array buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract filename from URL
    const urlPath = url.pathname;
    const fileName = urlPath.split('/').pop() || 'image.jpg';

    // Return the image as binary data with proper headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${fileName}"`,
        'X-Image-Filename': fileName,
      },
    });
  } catch (error) {
    console.error('Error downloading image:', error);
    return NextResponse.json(
      { error: `Failed to download image: ${error.message}` },
      { status: 500 }
    );
  }
}

