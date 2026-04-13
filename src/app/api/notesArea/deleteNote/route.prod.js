import { auth } from "../../../../auth.prod";
import client from "../../../../lib/db.prod";
import { NextResponse } from "next/server";
import { ObjectId } from 'mongodb';

// handle note deletion
// the user who posted the note can delete it
export async function DELETE(req) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ message: 'Unauthorized'}, { status: 401 });
    }

    try {
        const { _id, version } = await req.json();
        
        const db = await client.db('user');

        const note = await db.collection('notes').findOne({  _id: new ObjectId(_id) });


        if (!note) {
            return NextResponse.json(
                { message: 'note not found' }, 
                { status: 404 }
            );
        }

        if (note.user !== session.user.id) {
            return NextResponse.json({ message: 'Unauthorized'}, { status: 401 });
        }


        const transSession = client.startSession();
        transSession.startTransaction();

        try {
            const noteRes = await db.collection('notes').findOneAndDelete(
                { _id: new ObjectId(_id), version: version || 0 },
                { session: transSession });

            await transSession.commitTransaction();

            return NextResponse.json({ message: 'Note deleted' }, { status: 200 });
       
        } catch (error) {
            // rollback transaction if any error occurs
            await transSession.abortTransaction();
            throw error;
       
        } finally {
            transSession.endSession();
        };

    } catch (error) {
        console.error('Error removing note:', error);
        return NextResponse.json(
            { error: 'Failed to remove note' }, 
            { status: 500 }
        );
    }
}