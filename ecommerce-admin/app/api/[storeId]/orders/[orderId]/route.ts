import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";

import prismadb from "@/lib/prismadb";

export async function GET(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    if (!params.orderId) {
      return new NextResponse("Order id is required", { status: 400 });
    }

    const order = await prismadb.order.findUnique({
      where: {
        id: params.orderId
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        },
        customer: true
      }
    });
  
    return NextResponse.json(order);
  } catch (error) {
    console.log('[ORDER_GET]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { storeId: string, orderId: string } }
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

    if (!params.orderId) {
      return new NextResponse("Order id is required", { status: 400 });
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

    // Update or create customer if it's a guest
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

    // Update the order
    await prismadb.order.update({
      where: {
        id: params.orderId
      },
      data: {
        customerId: finalCustomerId,
        phone,
        email,
        address: addressLine1, // Store the primary address
        paymentStatus,
        paymentMethod,
        orderStatus,
        isPaid,
        orderItems: {
          deleteMany: {},
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

    return NextResponse.json({ message: "Order updated successfully" });
  } catch (error) {
    console.log('[ORDER_PATCH]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { storeId: string, orderId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 403 });
    }

    if (!params.orderId) {
      return new NextResponse("Order id is required", { status: 400 });
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

    // First delete all order items associated with this order
    await prismadb.orderItem.deleteMany({
      where: {
        orderId: params.orderId
      }
    });

    // Then delete the order
    const order = await prismadb.order.delete({
      where: {
        id: params.orderId
      }
    });
  
    return NextResponse.json(order);
  } catch (error) {
    console.log('[ORDER_DELETE]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}