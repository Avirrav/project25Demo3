'use client';

import * as z from 'zod';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { Order, OrderItem, Product, Customer } from '@prisma/client';
import { Trash } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useRouter } from 'next/navigation';

import { Heading } from '@/components/ui/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { AlertModal } from '@/components/modals/alert-modal';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const formSchema = z.object({
  customerType: z.enum(['existing', 'guest']),
  customerId: z.string().optional(),
  fullName: z.string().optional(),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email().optional().or(z.literal('')),
  addressLine1: z.string().min(1, "Address Line 1 is required"),
  addressLine2: z.string().optional().or(z.literal('')),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
  productIds: z.array(z.string()).min(1, "At least one product must be selected"),
  quantities: z.record(z.string(), z.number().min(1)),
  paymentStatus: z.enum(['paid', 'pending', 'partial']),
  paymentMethod: z.enum(['cash', 'credit_card', 'upi', 'bank_transfer', 'other']),
  orderStatus: z.enum(['draft', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned']),
  isPaid: z.boolean().default(false),
});

type OrderFormValues = z.infer<typeof formSchema>;

interface OrderFormProps {
  initialData: Order & {
    orderItems: (OrderItem & {
      product: Product;
    })[];
  } | null;
  products: Product[];
  customers: Customer[];
}

const PAYMENT_STATUSES = [
  { label: 'Paid', value: 'paid' },
  { label: 'Pending', value: 'pending' },
  { label: 'Partial', value: 'partial' },
];

const PAYMENT_METHODS = [
  { label: 'Cash', value: 'cash' },
  { label: 'Credit Card', value: 'credit_card' },
  { label: 'UPI', value: 'upi' },
  { label: 'Bank Transfer', value: 'bank_transfer' },
  { label: 'Other', value: 'other' },
];

const ORDER_STATUSES = [
  { label: 'Draft', value: 'draft' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Returned', value: 'returned' },
];

const COUNTRIES = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "Germany",
  "France",
  "India",
  "Japan",
];

export const OrderForm: React.FC<OrderFormProps> = ({
  initialData,
  products,
  customers,
}) => {
  const params = useParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const title = initialData ? 'Edit Order' : 'Create Order';
  const description = initialData ? 'Edit an existing order.' : 'Create a new order';
  const toastMessage = initialData ? 'Order updated.' : 'Order created.';
  const action = initialData ? 'Save changes' : 'Create';

  // Calculate initial values for the form
  const getInitialValues = () => {
    if (initialData) {
      const customerData = initialData.customerId ? customers.find(c => c.id === initialData.customerId) : null;
      let address = { addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: 'United States' };
      
      if (customerData?.shippingAddress) {
        try {
          address = JSON.parse(customerData.shippingAddress);
        } catch (e) {
          console.error('Error parsing shipping address:', e);
        }
      }

      const quantities: Record<string, number> = {};
      initialData.orderItems.forEach(item => {
        quantities[item.productId] = item.quantity;
      });

      return {
        customerType: initialData.customerId ? 'existing' as const : 'guest' as const,
        customerId: initialData.customerId || undefined,
        fullName: customerData?.fullName || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        addressLine1: address.addressLine1 || initialData.address,
        addressLine2: address.addressLine2 || '',
        city: address.city || '',
        state: address.state || '',
        postalCode: address.postalCode || '',
        country: address.country || 'United States',
        productIds: initialData.orderItems.map(item => item.productId),
        quantities,
        paymentStatus: initialData.paymentStatus as any,
        paymentMethod: initialData.paymentMethod as any,
        orderStatus: initialData.orderStatus as any,
        isPaid: initialData.isPaid
      };
    }

    return {
      customerType: 'guest' as const,
      fullName: '',
      email: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'United States',
      productIds: [],
      quantities: {},
      paymentStatus: 'pending' as const,
      paymentMethod: 'cash' as const,
      orderStatus: 'draft' as const,
      isPaid: false
    };
  };

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getInitialValues()
  });

  // Calculate total price based on selected products and quantities
  const calculateTotalPrice = () => {
    const selectedProducts = form.watch('productIds');
    const quantities = form.watch('quantities');
    
    return selectedProducts.reduce((total, productId) => {
      const product = products.find(p => p.id === productId);
      const quantity = quantities[productId] || 0;
      return total + (product ? Number(product.price) * quantity : 0);
    }, 0);
  };

  // Update payment status when total price changes
  useEffect(() => {
    const paymentStatus = form.watch('paymentStatus');
    if (paymentStatus === 'paid') {
      form.setValue('isPaid', true);
    } else {
      form.setValue('isPaid', false);
    }
  }, [form.watch('paymentStatus')]);

  // Handle customer selection
  const handleCustomerSelect = (customerId: string) => {
    const selectedCustomer = customers.find(c => c.id === customerId);
    if (selectedCustomer) {
      try {
        const address = JSON.parse(selectedCustomer.shippingAddress);
        form.setValue('phone', selectedCustomer.phone);
        form.setValue('email', selectedCustomer.email);
        form.setValue('addressLine1', address.addressLine1);
        form.setValue('addressLine2', address.addressLine2 || '');
        form.setValue('city', address.city);
        form.setValue('state', address.state);
        form.setValue('postalCode', address.postalCode);
        form.setValue('country', address.country);
      } catch (error) {
        console.error('Error parsing customer address:', error);
      }
    }
  };

  const onSubmit = async (data: OrderFormValues) => {
    try {
      setLoading(true);
      
      // Prepare the shipping address
      const shippingAddress = JSON.stringify({
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country
      });

      const totalPrice = calculateTotalPrice();

      const submitData = {
        ...data,
        shippingAddress,
        totalPrice,
        phone: data.phone,
        email: data.email || '',
        address: data.addressLine1, // Store the primary address
      };

      if (initialData) {
        await axios.patch(`/api/${params.storeId}/orders/${params.orderId}`, submitData);
      } else {
        await axios.post(`/api/${params.storeId}/orders`, submitData);
      }
      
      router.refresh();
      router.push(`/${params.storeId}/orders`);
      toast.success(toastMessage);
    } catch (error: any) {
      console.error('Order submission error:', error);
      toast.error('Failed to save order. Please check all required fields.');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/${params.storeId}/orders/${params.orderId}`);
      router.refresh();
      router.push(`/${params.storeId}/orders`);
      toast.success('Order deleted.');
    } catch (error: any) {
      toast.error('Something went wrong.');
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      <AlertModal 
        isOpen={open} 
        onClose={() => setOpen(false)}
        onConfirm={onDelete}
        loading={loading}
      />
      <div className="flex items-center justify-between">
        <Heading title={title} description={description} />
        {initialData && (
          <Button
            disabled={loading}
            variant="destructive"
            size="sm"
            onClick={() => setOpen(true)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Separator />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Customer Type Selection */}
            <FormField
              control={form.control}
              name="customerType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Type</FormLabel>
                  <Select
                    disabled={loading}
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="existing">Existing Customer</SelectItem>
                      <SelectItem value="guest">Guest Customer</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Existing Customer Selection */}
            {form.watch('customerType') === 'existing' && (
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Customer</FormLabel>
                    <Select
                      disabled={loading}
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleCustomerSelect(value);
                      }}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Guest Customer Information */}
            {form.watch('customerType') === 'guest' && !initialData && (
              <>
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input 
                          disabled={loading} 
                          placeholder="Customer's full name" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          disabled={loading} 
                          placeholder="Email address" 
                          type="email"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Common Fields */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input 
                      disabled={loading} 
                      placeholder="Phone number" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="addressLine1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 1</FormLabel>
                  <FormControl>
                    <Input 
                      disabled={loading} 
                      placeholder="Street address" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="addressLine2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 2 (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      disabled={loading} 
                      placeholder="Apartment, suite, etc." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input 
                      disabled={loading} 
                      placeholder="City" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State/Province</FormLabel>
                  <FormControl>
                    <Input 
                      disabled={loading} 
                      placeholder="State or province" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postal/ZIP Code</FormLabel>
                  <FormControl>
                    <Input 
                      disabled={loading} 
                      placeholder="Postal or ZIP code" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <Select
                    disabled={loading}
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Products Selection */}
            <FormField
              control={form.control}
              name="productIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Products</FormLabel>
                  <Select
                    disabled={loading}
                    onValueChange={(value) => {
                      const currentIds = field.value || [];
                      const newIds = currentIds.includes(value)
                        ? currentIds.filter(id => id !== value)
                        : [...currentIds, value];
                      field.onChange(newIds);
                      
                      // Initialize quantity if not exists
                      if (!currentIds.includes(value)) {
                        form.setValue(`quantities.${value}`, 1);
                      }
                    }}
                    value={field.value?.[0] || ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select products" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - ${product.price.toString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-4 space-y-2">
                    {field.value?.map((productId) => {
                      const product = products.find(p => p.id === productId);
                      return product ? (
                        <div key={productId} className="flex items-center gap-2">
                          <span>{product.name}</span>
                          <Input
                            type="number"
                            min="1"
                            className="w-24"
                            disabled={loading}
                            value={form.watch(`quantities.${productId}`) || 1}
                            onChange={(e) => {
                              form.setValue(`quantities.${productId}`, parseInt(e.target.value) || 1);
                            }}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={loading}
                            onClick={() => {
                              const newIds = field.value?.filter(id => id !== productId) || [];
                              field.onChange(newIds);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : null;
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Details */}
            <FormField
              control={form.control}
              name="paymentStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Status</FormLabel>
                  <Select
                    disabled={loading}
                    onValueChange={(value) => {
                      field.onChange(value);
                      if (value === 'paid') {
                        form.setValue('isPaid', true);
                      }
                    }}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAYMENT_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select
                    disabled={loading}
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="orderStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Status</FormLabel>
                  <Select
                    disabled={loading}
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select order status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ORDER_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPaid"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Mark as Paid
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex items-center space-x-2">
              <FormLabel>Total Price:</FormLabel>
              <span className="text-lg font-bold">${calculateTotalPrice().toFixed(2)}</span>
            </div>
          </div>
          <Button disabled={loading} className="ml-auto" type="submit">
            {action}
          </Button>
        </form>
      </Form>
    </>
  );
};

export default OrderForm;