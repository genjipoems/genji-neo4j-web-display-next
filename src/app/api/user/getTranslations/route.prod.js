import { auth } from "../../../../auth.prod";
import client from "../../../../lib/db.prod";
import { NextResponse } from "next/server";
import { ObjectId } from 'mongodb';

// get one user's all translations with pagination
export async function GET(req) {
  const session = await auth();

  let page = 1;
  let limit = 5;

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

    if (!userId) {
      return NextResponse.json({ message: 'Missing userId' }, { status: 400 });
    }

    if (pageParam) {
      const parsedPage = parseInt(pageParam);
      if (!isNaN(parsedPage) && parsedPage > 0) {
        page = parsedPage;
      }
    }

    if (limitParam) {
      const parsedLimit = parseInt(limitParam);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = parsedLimit;
      }
    }

    const skip = (page - 1) * limit;

    const db = await client.db('user');

    // Query translations by user field (string, based on your screenshot)
    const translations = await db.collection('translation')
      .find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    if (!translations || translations.length === 0) {
      return NextResponse.json({ translations: [] }, { status: 200 });
    }

    const totalTranslations = await db.collection('translation').countDocuments({ user: userId });

    // Optional: simplify the output to only necessary fields for frontend
    const simplifiedTranslations = translations.map(doc => ({
      id: doc._id.toString(),
      pageType: doc.pageType,
      identifier: doc.identifier,
      content: doc.content,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      isHidden: doc.isHidden,
      version: doc.version,
    }));

    return NextResponse.json({
      translations: simplifiedTranslations,
      totalTranslations,
      currentPage: page,
      totalPages: Math.ceil(totalTranslations / limit) || 1,
    }, { status: 200 });

  } catch (error) {
    console.error('Error finding translations:', error);
    return NextResponse.json(
      { error: 'Failed to find user translations' },
      { status: 500 }
    );
  }
}
