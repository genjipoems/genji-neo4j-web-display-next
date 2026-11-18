export const dynamic = 'force-dynamic';
import { auth } from "../../../../auth.prod";
import client from "../../../../lib/db.prod";
import { NextResponse } from "next/server";
import { ObjectId } from 'mongodb';

// get all comments for a page including the user info for each comment
export async function GET(req) {
    try {
        const session = await auth();
        const { searchParams } = new URL(req.url);
        const pageType = searchParams.get('pageType');
        const identifier = searchParams.get('identifier');

        const db = await client.db('user');

        // Get all translations for the page
        const translations = await db.collection('translation')
            .find({ pageType, identifier })
            .sort({ createdAt: -1 })
            .toArray();
            
        if (!translations || translations.length === 0) {
            return NextResponse.json({ trans: [] }, { status: 200 });
        }

        // Collect user IDs from translations that have a user field
        const userIds = [...new Set(
            translations
                .map(trans => trans.user)
                .filter(id => typeof id === 'string' && ObjectId.isValid(id))
        )].map(id => new ObjectId(id));


        // Get user info if there are any user IDs
        let userMap = new Map();
        if (userIds.length > 0) {
            const users = await db.collection('info')
                .find({ _id: { $in: userIds } })
                .project({ _id: 1, name: 1, googleName: 1, image: 1 })
                .toArray();

            userMap = new Map(users.map(user => [user._id.toString(), user]));
        }

        const currentUser = session?.user?.email
            ? await db.collection('info').findOne(
                { email: session.user.email },
                { projection: { _id: 1 } }
            )
            : null;

        // Add user info to translations
        const transWithUserInfo = translations.map(trans => {
    
            const user = trans.user ? userMap.get(trans.user.toString()) : null;
            if (user) {
                trans.userName = user.name || user.googleName || 'Unknown user';
                trans.userImage = user.image;
            } else {
                trans.userName = 'Unknown user';
            }
            trans.isOwner = !!currentUser && trans.user?.toString() === currentUser._id.toString();

            return trans;
        });

        return NextResponse.json({ trans: transWithUserInfo }, { status: 200 });

    } catch (error) {
        console.error('Error getting translations:', error);
        return NextResponse.json(
            { error: 'Failed to fetch translations' }, 
            { status: 500 }
        );
    }
}