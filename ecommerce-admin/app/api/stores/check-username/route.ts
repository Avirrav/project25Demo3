import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

import prismadb from '@/lib/prismadb';

export async function GET(
  req: Request
) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');
    const storeId = searchParams.get('storeId');

    if (!username) {
      return new NextResponse('Username is required', { status: 400 });
    }

    const existingStore = await prismadb.store.findFirst({
      where: {
        username: username,
        NOT: {
          id: storeId || undefined
        }
      }
    });

    return NextResponse.json({ available: !existingStore });
  } catch (error) {
    console.log('[USERNAME_CHECK]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}