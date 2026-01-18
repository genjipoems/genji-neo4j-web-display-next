import client from '../../../../lib/db.prod';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

const { getSession } = require('../../neo4j_driver/route.prod.js');

export const dynamic = 'force-dynamic';

// use userId in mongodb to get user's email
async function getEmailForUserId(userId) {
  const db = await client.db('user');
  const info = db.collection('info');

  const user = await info.findOne(
    { _id: new ObjectId(userId) },
    { projection: { email: 1 } }
  );

  if (!user?.email) {
    throw new Error('User email not found');
  }

  return user.email;
}

//retrieve blogs for a given email
async function getBlogsForEmail(email, page, limit) {
  const session = await getSession();
  const skip = (page - 1) * limit;

  try {
    const blogsResult = await session.run(
      `
      MATCH (p:People {email: $email})-[:AUTHOR_OF]->(b:Blog)
      RETURN
        id(b)        AS id,
        b.title      AS title,
        b.content    AS content,
        b.showOnPage AS showOnPage
      ORDER BY b.title ASC
      SKIP toInteger($skip)
      LIMIT toInteger($limit)
      `,
      { email, skip, limit }
    );

    const blogs = blogsResult.records.map((r) => ({
      id: r.get('id')?.toNumber?.() ?? r.get('id'),
      title: r.get('title'),
      content: r.get('content'),
      showOnPage: r.get('showOnPage') ?? false,
    }));

    const countResult = await session.run(
      `
      MATCH (p:People {email: $email})-[:AUTHOR_OF]->(b:Blog)
      RETURN count(b) AS total
      `,
      { email }
    );

    const total = countResult.records[0].get('total')?.toNumber() ?? 0;

    return { blogs, total };
  } finally {
    await session.close();
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '8', 10));

    if (!userId) {
      return NextResponse.json({ message: 'Missing userId' }, { status: 400 });
    }

    const email = await getEmailForUserId(userId);
    const { blogs, total } = await getBlogsForEmail(email, page, limit);

    return NextResponse.json(
      {
        blogs,
        totalBlogs: total,
        currentPage: page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Error in /api/user/getBlogs:', err);
    return NextResponse.json(
      { message: 'Failed to find user blogs' },
      { status: 500 }
    );
  }
}
