import { auth } from "../../../../auth.prod";
import client from "../../../../lib/db.prod";
import { NextResponse } from "next/server";
import { ObjectId } from 'mongodb';

// handle trans deletion
// Users can delete their own translations; admins can delete any translation.
export async function DELETE(req) {
    const session = await auth();

    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Unauthorized'}, { status: 401 });
    }

    try {
        const { _id, version } = await req.json();

        if (!ObjectId.isValid(_id)) {
            return NextResponse.json({ message: 'Invalid translation ID' }, { status: 400 });
        }
        
        const db = await client.db('user');
        const isAdmin = session.user.role === 'admin';
        const submitter = isAdmin ? null : await db.collection('info').findOne(
            { email: session.user.email },
            { projection: { _id: 1 } }
        );

        const trans = await db.collection('translation').findOne({  _id: new ObjectId(_id) });


        if (!trans) {
            return NextResponse.json(
                { message: 'trans not found' }, 
                { status: 404 }
            );
        }

        if (!isAdmin && (!submitter || trans.user?.toString() !== submitter._id.toString())) {
            return NextResponse.json({ message: 'You can only delete your own translations' }, { status: 403 });
        }


        const transSession = client.startSession();
        transSession.startTransaction();

        try {

            // Delete notifications related to the trans itself
            await db.collection('notification').deleteMany({
                relatedItem: _id
            }, { session: transSession });


            const transRes = await db.collection('translation').findOneAndDelete({ 
                _id: new ObjectId(_id),
                version: version || 0 
            }, { session: transSession });

            // if trans has been modified by another admin rollback transaction
            if (!transRes) {
                await transSession.abortTransaction();
                transSession.endSession();
                return NextResponse.json({ 
                        message: 'Translation has been deleted by another admin, refresh and try again', 
                        errorType: 'versionConflict'
                    }, { status: 409 }
                );
            }

            await transSession.commitTransaction();

            return NextResponse.json({ message: 'translation and related notifications deleted' }, { status: 200 });
       
        } catch (error) {
            // rollback transaction if any error occurs
            await transSession.abortTransaction();
            throw error;
       
        } finally {
            transSession.endSession();
        };

    } catch (error) {
        console.error('Error removing trans:', error);
        return NextResponse.json(
            { error: 'Failed to remove trans' }, 
            { status: 500 }
        );
    }
}