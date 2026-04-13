import { auth } from "../../../../auth.prod";
import client from "../../../../lib/db.prod";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

// get all notes for a page including the user info for each note
export async function GET(req) {
    const session = await auth();

    let page = 1;
    let limit = 5;

    if (!session) {
        return NextResponse.json({ message: 'Unauthorized'}, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const pageType = searchParams.get('pageType');
        const identifier = searchParams.get('identifier');
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
                        pageType,
                        identifier,
                        user: session.user.id
                    }
                },
                { $sort: { createdAt: -1 } }
            ])
            .skip(skip)
            .limit(limit)
            .toArray();
            
        if (!notes || notes.length === 0) {
            return NextResponse.json({ notes: [] }, { status: 200 });
        }
        
        const userIds = [...new Set([
            ...notes.map(note => note.user),
        ])].filter(id => ObjectId.isValid(id))
        .map(id => new ObjectId(id));

        // match the user id with the user info
        const users = await db.collection('info')
            .find({ _id: { $in: userIds } })
            .project({ _id: 1, name: 1, googleName: 1, image: 1 })
            .toArray();

        const currentUserInfo = await db.collection("info").findOne(
            { email: session.user.email },
            { projection: { name: 1, googleName: 1, image: 1 } }
        );

        // match note with user info and reply
        notes.forEach(note => {
                note.userName = currentUserInfo?.name || currentUserInfo?.googleName || session.user.email || "";
                note.userImage = currentUserInfo?.image || session.user.image || "";
        });
        
        const totalNotes = await db.collection('notes').countDocuments({ pageType, identifier, user: session.user.id });

        return NextResponse.json({ notes, totalNotes, currentPage: page, totalPages: Math.ceil(totalNotes / limit) || 1 }, { status: 200 });

    } catch (error) {
        console.error('Error getting notes:', error);
        return NextResponse.json(
            { error: 'Failed to get notes' }, 
            { status: 500 }
        );
    }


}