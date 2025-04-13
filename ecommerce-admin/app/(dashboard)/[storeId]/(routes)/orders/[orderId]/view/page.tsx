import { format } from 'date-fns';
import prismadb from '@/lib/prismadb';
import { formatter } from '@/lib/utils';
import { OrderView } from './components/order-view';

const OrderViewPage = async ({
  params
}: {
  params: { orderId: string }
}) => {
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

  if (!order) {
    return null;
  }

  // Calculate total price from order items
  const totalPrice = order.orderItems.reduce((total, item) => {
    return total + (item.product.price.toNumber() * item.quantity);
  }, 0);

  const formattedOrder = {
    ...order,
    createdAt: format(order.createdAt, 'MMMM do, yyyy'),
    updatedAt: format(order.updatedAt, 'MMMM do, yyyy'),
    totalAmount: totalPrice
  };

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <OrderView data={formattedOrder} />
      </div>
    </div>
  );
};

export default OrderViewPage;