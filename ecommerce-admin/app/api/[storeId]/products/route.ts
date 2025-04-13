import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import prismadb from '@/lib/prismadb';

export async function POST(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    const { userId } = auth();

    const body = await req.json();

    const {
      name,
      description,
      price,
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
      categoryId,
      colorId,
      sizeId,
      images,
      isFeatured,
      isArchived,
    } = body;

    if (!userId) {
      return new NextResponse('Unauthenticated', { status: 403 });
    }

    if (!name) {
      return new NextResponse('Name is required', { status: 400 });
    }

    if (!description) {
      return new NextResponse('Description is required', { status: 400 });
    }

    if (!images || !images.length) {
      return new NextResponse('Images are required', { status: 400 });
    }

    if (!price) {
      return new NextResponse('Price is required', { status: 400 });
    }

    if (!costPerItem) {
      return new NextResponse('Cost per item is required', { status: 400 });
    }

    if (!sku) {
      return new NextResponse('SKU is required', { status: 400 });
    }

    if (typeof stockQuantity !== 'number') {
      return new NextResponse('Stock quantity is required', { status: 400 });
    }

    if (!categoryId) {
      return new NextResponse('Category id is required', { status: 400 });
    }

    if (!colorId) {
      return new NextResponse('Color id is required', { status: 400 });
    }

    if (!sizeId) {
      return new NextResponse('Size id is required', { status: 400 });
    }

    if (!params.storeId) {
      return new NextResponse('Store id is required', { status: 400 });
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

    // Check if SKU already exists using findFirst instead of findUnique
    const existingSku = await prismadb.product.findFirst({
      where: {
        sku: sku,
        storeId: params.storeId
      }
    });

    if (existingSku) {
      return new NextResponse('SKU already exists in this store', { status: 400 });
    }

    const product = await prismadb.product.create({
      data: {
        name,
        description,
        price: typeof price === 'string' ? parseFloat(price) : price,
        costPerItem: typeof costPerItem === 'string' ? parseFloat(costPerItem) : costPerItem,
        profitMargin: profitMargin || 0,
        taxes,
        sku,
        stockQuantity,
        sellWhenOutOfStock: sellWhenOutOfStock || false,
        requiresShipping: requiresShipping ?? true,
        weight: weight ? parseFloat(String(weight)) : null,
        weightUnit,
        length: length ? parseFloat(String(length)) : null,
        width: width ? parseFloat(String(width)) : null,
        height: height ? parseFloat(String(height)) : null,
        categoryId,
        colorId,
        sizeId,
        isFeatured: isFeatured || false,
        isArchived: isArchived || false,
        storeId: params.storeId,
        images: {
          createMany: {
            data: [...images.map((image: { url: string }) => image)],
          },
        },
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.log('[PRODUCTS_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId') || undefined;
    const colorId = searchParams.get('colorId') || undefined;
    const sizeId = searchParams.get('sizeId') || undefined;
    const isFeatured = searchParams.get('isFeatured');

    if (!params.storeId) {
      return new NextResponse('Store id is required', { status: 400 });
    }

    const products = await prismadb.product.findMany({
      where: {
        storeId: params.storeId,
        categoryId,
        colorId,
        sizeId,
        isFeatured: isFeatured ? true : undefined,
        isArchived: false,
      },
      include: {
        images: true,
        category: true,
        color: true,
        size: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.log('[PRODUCTS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}