import { auth } from "../../../auth.prod";
import client from "../../../lib/db.prod";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

// api to get user note
export async function GET(req) {
    try {
    const session = await auth();

    // If not logged in: return null 
    if (!session?.user?.id) {
      return NextResponse.json({ note: null }, { status: 200 });
    }
  
  const { searchParams } = new URL(req.url);
  const chapter = Number(searchParams.get("chapter"));
  const pnum = Number(searchParams.get("pnum"));

  const db = await client.db("user");

  const userNotes = await db.collection("user_notes")
                            .findOne({
                              userId: new ObjectId(session.user.id),
                              chapter,
                              pnum,
                            });
  
  return NextResponse.json({ userNotes }, { status: 200 });

  } catch (error) {
    console.error("Error fetching user note", error);
    return NextResponse.json({message: "Internal server error" }, { status: 500 });
  }
}

// api to post user note
export async function POST(request) {
  try {

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const chapter = Number(body.chapter);
    const pnum = Number(body.pnum);
    const text = body.text ?? "";

    const db = await client.db("user");

    const result = await db.collection("user_notes").findOneAndUpdate(
      {
        userId: new ObjectId(session.user.id),
        chapter,
        pnum
      },
      {
        $set: { text, updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true, returnDocument: "after" }
    );

    return NextResponse.json({ note: result.value }, { status: 200 });

  } catch (error) {
    console.error("Error saving user note:",error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}