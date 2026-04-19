import { auth } from "../../../../auth.prod";
import client from "../../../../lib/db.prod";
import { NextResponse } from "next/server";
import { ObjectId } from 'mongodb';

// get one user's all contributions
export async function GET(req) {
    const session = await auth();

    let page = 1;
    let limit = 5;

    if (!session) {
        return NextResponse.json({ message: 'Unauthorized'}, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
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

        const contributions = await db.collection('contribution')
            .aggregate([
                { 
                    $match: {
                        contributors: userId
                    }
                },
                {
                    $sort: {  
                        updatedAt: -1   
                    }
                }
            ])
            .skip(skip)
            .limit(limit)
            .toArray();

        // console.log('userId:', userId);

        if (!contributions || contributions.length === 0) {
            return NextResponse.json({ contributions: [] }, { status: 200 });
        }

        const totalContributions = await db.collection('contribution').countDocuments({ contributors: userId });

        return NextResponse.json({ contributions, totalContributions, currentPage: page, totalPages: Math.ceil(totalContributions / limit) || 1 }, { status: 200 });

    } catch (error) {
        console.error('Error finding contributions:', error);
        return NextResponse.json(
            { error: 'Failed to find user contributions' }, 
            { status: 500 }
        );
    }
}