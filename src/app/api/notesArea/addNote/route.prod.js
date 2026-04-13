import { version } from "os";
import { auth } from "../../../../auth.prod";
import client from "../../../../lib/db.prod";
import { NextResponse } from "next/server";

export async function POST(req) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ message: 'Unauthorized'}, { status: 401 });
    }
           
        // for registered users, add into the record of notes
    try {
        const { pageType, identifier, content } = await req.json();
            
        const db = await client.db('user');

        // add note to the notes collection
        const result = await db.collection('notes').insertOne( 
                                                                 { 
                                                                    pageType: pageType, 
                                                                    identifier: identifier,
                                                                    user: session.user.id,
                                                                    content: content,
                                                                    createdAt: new Date(),
                                                                    updatedAt: new Date(),
                                                                    isEdited: false,
                                                                    version: 0
                                                                 } )

        return NextResponse.json({ result, _id: result.insertedId }, { status: 200 });

    } catch (error) {
        console.error('Error adding note:', error);
        return NextResponse.json({ error: 'Failed to add note' }, { status: 500 });
    }

}
