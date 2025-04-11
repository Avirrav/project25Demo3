import { format } from 'date-fns';

import prismadb from '@/lib/prismadb';
import { CustomersClient } from './components/client';
import { CustomerColumn } from './components/columns';

const CustomersPage = async ({
  params
}: {
  params: { storeId: string }
}) => {
  const customers = await prismadb.customer.findMany({
    where: {
      storeId: params.storeId
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const formattedCustomers: CustomerColumn[] = customers.map((item) => {
    let address = { city: '', state: '', country: '' };
    try {
      const parsedAddress = JSON.parse(item.shippingAddress);
      address = {
        city: parsedAddress.city || '',
        state: parsedAddress.state || '',
        country: parsedAddress.country || ''
      };
    } catch (e) {
      console.error('Error parsing shipping address:', e);
    }

    return {
      id: item.id,
      fullName: item.fullName,
      email: item.email,
      phone: item.phone,
      address,
      createdAt: format(item.createdAt, 'MMMM do, yyyy'),
    };
  });

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <CustomersClient data={formattedCustomers} />
      </div>
    </div>
  );
};

export default CustomersPage;