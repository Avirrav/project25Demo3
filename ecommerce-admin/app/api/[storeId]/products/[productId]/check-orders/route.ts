import { NextResponse } from 'next/server';
import prismadb from '@/lib/prismadb';

export async function GET(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    if (!params.productId) {
      return new NextResponse('Product ID is required', { status: 400 });
    }

    // Check if there are any order items for this product
    const orderItems = await prismadb.orderItem.findFirst({
      where: {
        productId: params.productId,
      },
    });

    return NextResponse.json({ hasOrders: !!orderItems });
  } catch (error) {
    console.log('[CHECK_ORDERS]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}