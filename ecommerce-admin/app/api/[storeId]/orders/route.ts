import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";

import prismadb from "@/lib/prismadb";

export async function POST(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    const { userId } = auth();
    const body = await req.json();

    const {
      customerType,
      customerId,
      fullName,
      email,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      productIds,
      quantities,
      paymentStatus,
      paymentMethod,
      totalPrice,
      orderStatus,
      isPaid
    } = body;

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 403 });
    }

    if (!params.storeId) {
      return new NextResponse("Store id is required", { status: 400 });
    }

    const storeByUserId = await prismadb.store.findFirst({
      where: {
        id: params.storeId,
        userId
      }
    });

    if (!storeByUserId) {
      return new NextResponse("Unauthorized", { status: 405 });
    }

    // Prepare the shipping address
    const shippingAddress = JSON.stringify({
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country
    });

    // Create or get customer
    let finalCustomerId = customerId;
    if (customerType === 'guest' && fullName) {
      const customer = await prismadb.customer.create({
        data: {
          storeId: params.storeId,
          fullName,
          email: email || '',
          phone,
          shippingAddress
        }
      });
      finalCustomerId = customer.id;
    }

    // Create the order
    const order = await prismadb.order.create({
      data: {
        storeId: params.storeId,
        customerId: finalCustomerId,
        phone,
        email,
        address: addressLine1, // Store the primary address
        paymentStatus,
        paymentMethod,
        orderStatus,
        isPaid,
        orderItems: {
          create: Object.entries(quantities).map(([productId, quantity]) => ({
            product: {
              connect: {
                id: productId
              }
            },
            quantity
          }))
        }
      }
    });
  
    return NextResponse.json(order);
  } catch (error) {
    console.log('[ORDERS_POST]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const isPaid = searchParams.get('isPaid');
    const status = searchParams.get('status');

    if (!params.storeId) {
      return new NextResponse("Store id is required", { status: 400 });
    }

    const orders = await prismadb.order.findMany({
      where: {
        storeId: params.storeId,
        isPaid: isPaid ? true : undefined,
        orderStatus: status || undefined
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        },
        customer: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.log('[ORDERS_GET]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}