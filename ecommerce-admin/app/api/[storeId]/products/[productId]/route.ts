import prismadb from '@/lib/prismadb';
import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    if (!params.productId) {
      return new NextResponse('Product id is Required', { status: 400 });
    }

    const product = await prismadb.product.findUnique({
      where: {
        id: params.productId,
      },
      include: {
        images: true,
        category: true,
        color: true,
        size: true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.log('[PRODUCT_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { storeId: string; productId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse('Unauthenticated', { status: 403 });
    }

    if (!params.productId) {
      return new NextResponse('Product id is Required', { status: 400 });
    }

    const storByUserId = await prismadb.store.findFirst({
      where: {
        id: params.storeId,
        userId,
      },
    });

    if (!storByUserId) {
      return new NextResponse('Unauthorized', { status: 405 });
    }

    // First delete all related order items
    await prismadb.orderItem.deleteMany({
      where: {
        productId: params.productId,
      },
    });

    // Then delete the product
    const product = await prismadb.product.delete({
      where: {
        id: params.productId,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.log('[PRODUCT_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { productId: string; storeId: string } }
) {
  try {
    const { userId } = auth();
    const body = await req.json();

    const {
      name,
      price,
      categoryId,
      colorId,
      sizeId,
      images,
      isFeatured,
      isArchived,
      description,
      costPerItem,
      profitMargin,
      taxes,
      sku,
      stockQuantity,
      sellWhenOutOfStock,
      requiresShipping,
      weight,
      weightUnit,
      length,
      width,
      height,
    } = body;

    if (!userId) {
      return new NextResponse('Unauthenticated', { status: 403 });
    }

    if (!params.productId) {
      return new NextResponse('Product id is required', { status: 400 });
    }

    const storeByUserId = await prismadb.store.findFirst({
      where: {
        id: params.storeId,
        userId,
      },
    });

    if (!storeByUserId) {
      return new NextResponse('Unauthorized', { status: 405 });
    }

    // Create the update data object
    const updateData: any = {};

    // Only include fields that are present in the request body
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (colorId !== undefined) updateData.colorId = colorId;
    if (sizeId !== undefined) updateData.sizeId = sizeId;
    if (costPerItem !== undefined) updateData.costPerItem = costPerItem;
    if (profitMargin !== undefined) updateData.profitMargin = profitMargin;
    if (taxes !== undefined) updateData.taxes = taxes;
    if (sku !== undefined) updateData.sku = sku;
    if (stockQuantity !== undefined) updateData.stockQuantity = stockQuantity;
    if (sellWhenOutOfStock !== undefined) updateData.sellWhenOutOfStock = sellWhenOutOfStock;
    if (requiresShipping !== undefined) updateData.requiresShipping = requiresShipping;
    if (weight !== undefined) updateData.weight = weight;
    if (weightUnit !== undefined) updateData.weightUnit = weightUnit;
    if (length !== undefined) updateData.length = length;
    if (width !== undefined) updateData.width = width;
    if (height !== undefined) updateData.height = height;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    if (isArchived !== undefined) updateData.isArchived = isArchived;

    // Handle images separately only if they are provided
    if (images) {
      // First, delete existing images
      await prismadb.image.deleteMany({
        where: {
          productId: params.productId
        }
      });

      // Add images to update data
      updateData.images = {
        createMany: {
          data: images.map((image: { url: string }) => ({
            url: image.url
          }))
        }
      };
    }

    const product = await prismadb.product.update({
      where: {
        id: params.productId,
      },
      data: updateData,
    });

    return NextResponse.json(product);
  } catch (error) {
    console.log('[PRODUCT_PATCH]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
