import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";

export async function GET(
  req: Request,
  { params }: { params: { username: string } }
) {
  try {
    if (!params.username) {
      return new NextResponse("Username is required", { status: 400 });
    }

    const store = await prismadb.store.findFirst({
      where: {
        username: params.username,
      }
    });

    return NextResponse.json(store);
  } catch (error) {
    console.log('[STORE_GET]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}