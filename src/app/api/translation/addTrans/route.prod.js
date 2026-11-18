import { auth } from "../../../../auth.prod";
import client from "../../../../lib/db.prod";
import { NextResponse } from "next/server";

export async function POST(req) {
           
    const session = await auth();

    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Unauthorized'}, { status: 401 });
    }

    // all registered or unregisterd users can add new trans
    try {
        const { pageType, identifier, content } = await req.json();

        if (typeof pageType !== 'string' || !pageType || typeof identifier !== 'string' || !identifier || typeof content !== 'string' || !content.trim()) {
            return NextResponse.json({ message: 'pageType, identifier, and content are required' }, { status: 400 });
        }
            
        const db = await client.db('user');
        const submitter = await db.collection('info').findOne(
            { email: session.user.email },
            { projection: { _id: 1, name: 1, googleName: 1 } }
        );

        if (!submitter) {
            return NextResponse.json({ message: 'User profile not found' }, { status: 404 });
        }

        const userId = submitter._id.toString();
        const senderName = submitter.name?.trim() || submitter.googleName?.trim() || session.user.name || session.user.email;

        // add trans to the translation collection
        const trans = await db.collection('translation').insertOne( 
            { 
            pageType: pageType, 
            identifier: identifier,
            user: userId,
            content: content,
            createdAt: new Date(),
            updatedAt: new Date(),
            isHidden: false,
            version: 0
            } )


        // add notification to admins
        await db.collection('notification').insertOne(
            {
                recipient: 'admin',
                sender: userId,
                senderName,
                senderImage: session.user.image,
                type: 'newTrans',
                relatedItem: trans.insertedId.toString(),
                pageType,
                identifier,
                content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                needsReview: true,
                isRead: false,
                createdAt: new Date(),
                version: 0
            });

        return NextResponse.json({ trans, _id: trans.insertedId }, { status: 200 });

    } catch (error) {
        console.error('Error adding trans:', error);
        return NextResponse.json({ error: 'Failed to add trans' }, { status: 500 });
    }

}
