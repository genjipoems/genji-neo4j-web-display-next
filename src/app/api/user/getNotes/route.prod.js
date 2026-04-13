import { auth } from "../../../../auth.prod";
import client from "../../../../lib/db.prod";
import { NextResponse } from "next/server";

// get one user's all notes
export async function GET(req) {
    const session = await auth();

    let page = 1;
    let limit = 5;

    if (!session) {
        return NextResponse.json({ message: 'Unauthorized'}, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const userId = session.user.id;
        const pageParam = searchParams.get('page');
        const limitParam = searchParams.get('limit');

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

        const notes = await db.collection('notes')
            .aggregate([
                { 
                    $match: {
                        user: userId
                    }
                },
                {
                    $sort: {  
                        createdAt: -1   
                    }
                }
            ])
            .skip(skip)
            .limit(limit)
            .toArray();

        if (!notes || notes.length === 0) {
            return NextResponse.json({ notes: [] }, { status: 200 });
        }

        const totalNotes = await db.collection('notes').countDocuments({ user: userId, isHidden: false });

        return NextResponse.json({ notes, totalNotes, currentPage: page, totalPages: Math.ceil(totalNotes / limit) || 1 }, { status: 200 });

    } catch (error) {
        console.error('Error finding notes:', error);
        return NextResponse.json(
            { error: 'Failed to find user notes' }, 
            { status: 500 }
        );
    }
}