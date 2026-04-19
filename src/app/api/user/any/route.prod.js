import { auth } from "../../../../auth.prod";
import client from "../../../../lib/db.prod";
import { NextResponse } from "next/server";
import { ObjectId } from 'mongodb'; 

export async function GET(req) {
  const session = await auth();

  const { searchParams } = new URL(req.url);
  const userid = searchParams.get('userid');

  if (!userid) {
    return NextResponse.json({ message: 'User id is required' }, { status: 400 });
  }

  if (!ObjectId.isValid(userid)) {
    return NextResponse.json({ message: 'Invalid user id' }, { status: 400 });
  }

  try {
    const db = client.db("user");
    const user = await db.collection("info").findOne({ _id: new ObjectId(userid) });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const { password, ...userInfo } = user;

    return NextResponse.json(userInfo, { status: 200 });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}