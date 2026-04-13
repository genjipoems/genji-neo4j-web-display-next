import { auth } from "../../../../auth.prod";
import client from "../../../../lib/db.prod";
import { NextResponse } from "next/server";
import { ObjectId } from 'mongodb';

// only the user who posted the comment can update it
export async function POST(req) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ message: 'Unauthorized'}, { status: 401 });
    }

    try {
        const { _id, content, version } = await req.json();
        
        const db = await client.db('user');

        const comment = await db.collection('notes').findOne({  _id: new ObjectId(_id) });

        if (!comment) {
            return NextResponse.json(
                { message: 'comment not found' }, 
                { status: 404 }
            );
        }

        if (comment.user !== session.user.id) {
            return NextResponse.json({ message: 'Unauthorized'}, { status: 401 });
        }

        const res = await db.collection('notes').findOneAndUpdate(
            {  
                _id: new ObjectId(_id),
                user: session.user.id,
                version: version || 0
            },    
            { 
                $set: { 
                    content: content,
                    isEdited: true,
                    updatedAt: new Date()
                },
                $inc: { version: 1 }
            },
            { returnDocument: 'after' }
        );

        //console.log('findOneAndUpdate result:', JSON.stringify(res, null, 2));

        if (!res) {
            return NextResponse.json({ 
                    message: 'Comment was updated by another user',
                    errorType: 'versionConflict'
                },{ status: 409 }
            );
        };

        return NextResponse.json({ message: 'Comment updated' }, { status: 200 });

    } catch (error) {
        console.error('Error updating comment:', error);
        return NextResponse.json(
            { error: 'Failed to update comment' }, 
            { status: 500 }
        );
    }
}