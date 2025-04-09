import { format } from 'date-fns';
import prismadb from '@/lib/prismadb';
import { formatter } from '@/lib/utils';
import { ProductView } from './components/product-view';

const ProductViewPage = async ({
  params
}: {
  params: { productId: string }
}) => {
  const product = await prismadb.product.findUnique({
    where: {
      id: params.productId
    },
    include: {
      images: true,
      category: true,
      size: true,
      color: true,
    }
  });

  if (!product) {
    return null;
  }

  const formattedProduct = {
    ...product,
    price: formatter.format(product.price.toNumber()),
    costPerItem: formatter.format(product.costPerItem.toNumber()),
    profitMargin: `${product.profitMargin.toNumber()}%`,
    weight: product.weight?.toNumber(),
    length: product.length?.toNumber(),
    width: product.width?.toNumber(),
    height: product.height?.toNumber(),
    createdAt: format(product.createdAt, 'MMMM do, yyyy'),
  };

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ProductView data={formattedProduct} />
      </div>
    </div>
  );
};

export default ProductViewPage;