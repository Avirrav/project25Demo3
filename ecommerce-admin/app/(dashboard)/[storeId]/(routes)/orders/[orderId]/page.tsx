import prismadb from '@/lib/prismadb';
import { OrderForm } from './components/order-form';

const OrderPage = async ({
  params
}: {
  params: { orderId: string, storeId: string }
}) => {
  const order = await prismadb.order.findUnique({
    where: {
      id: params.orderId
    },
    include: {
      orderItems: true
    }
  });

  const products = await prismadb.product.findMany({
    where: {
      storeId: params.storeId,
    }
  });

  const customers = await prismadb.customer.findMany({
    where: {
      storeId: params.storeId,
    }
  });

  return ( 
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <OrderForm 
          initialData={order}
          products={products}
          customers={customers}
        />
      </div>
    </div>
  );
}

export default OrderPage;