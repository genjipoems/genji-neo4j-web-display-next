import { auth } from "../../../../auth.prod";
import client from "../../../../lib/db.prod";
import { NextResponse } from "next/server";

// api to get contributors for the current page
export async function GET(req) {
    const session = await auth();

    try {
        const url = new URL(req.url);
        const pageType = url.searchParams.get('pageType');
        const identifier = url.searchParams.get('identifier');

        const db = await client.db('user');

        const contributionDoc = await db.collection('contribution').findOne({ pageType, identifier });

        if (!contributionDoc || !contributionDoc.contributors || contributionDoc.contributors.length === 0) {
            return NextResponse.json({ contributor: [], message: 'no contributor' }, { status: 200 });
        }

        // IMPORTANT: return user ids here, not emails
        const contributorObjects = contributionDoc.contributors.map(id => ({
            contributor: id
        }));

        return NextResponse.json({ contributor: contributorObjects }, { status: 200 });

    } catch (error) {
        console.error('Error getting contributor:', error);
        return NextResponse.json({ error: 'Failed to get contributor' }, { status: 500 });
    }
}