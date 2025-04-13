'use client';

import * as z from 'zod';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { Category, Color, Image, Product, Size } from '@prisma/client';
import { Trash, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useRouter } from 'next/navigation';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Heading } from '@/components/ui/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { AlertModal } from '@/components/modals/alert-modal';
import ImageUpload from '@/components/ui/image-upload';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

interface Tax {
  name: string;
  value: number;
}

const formSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  images: z.object({ url: z.string() }).array(),
  costPerItem: z.coerce.number().min(0),
  profitMargin: z.coerce.number().min(0),
  price: z.coerce.number().min(0),
  sku: z.string().min(1),
  stockQuantity: z.coerce.number().min(0),
  sellWhenOutOfStock: z.boolean().default(false),
  requiresShipping: z.boolean().default(true),
  weight: z.coerce.number().optional(),
  weightUnit: z.string().optional(),
  length: z.coerce.number().optional(),
  width: z.coerce.number().optional(),
  height: z.coerce.number().optional(),
  categoryId: z.string().min(1),
  colorId: z.string().min(1),
  sizeId: z.string().min(1),
  isFeatured: z.boolean().default(false),
  isArchived: z.boolean().default(false),
});

type ProductFormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
  initialData:
    | (Product & {
        images: Image[];
        costPerItem?: number;
        profitMargin?: number;
        weight?: number;
        length?: number;
        width?: number;
        height?: number;
      })
    | null;
  categories: Category[];
  sizes: Size[];
  colors: Color[];
}

export const ProductForm = ({
  initialData,
  categories,
  sizes,
  colors,
}: ProductFormProps) => {
  const params = useParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [taxes, setTaxes] = useState<Tax[]>(
    initialData?.taxes ? JSON.parse(initialData.taxes) : []
  );
  const [newTaxName, setNewTaxName] = useState('');
  const [newTaxValue, setNewTaxValue] = useState('');

  const title = initialData ? 'Edit product' : 'Create product';
  const description = initialData ? 'Edit a product' : 'Add a new product';
  const toastMessage = initialData ? 'Product Updated.' : 'Product Created.';
  const action = initialData ? 'Save changes' : 'Create';

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          price: parseFloat(String(initialData?.price)),
          costPerItem: parseFloat(String(initialData?.costPerItem)),
          profitMargin: parseFloat(String(initialData?.profitMargin)),
          weight: initialData?.weight ? parseFloat(String(initialData.weight)) : undefined,
          length: initialData?.length ? parseFloat(String(initialData.length)) : undefined,
          width: initialData?.width ? parseFloat(String(initialData.width)) : undefined,
          height: initialData?.height ? parseFloat(String(initialData.height)) : undefined,
        }
      : {
          name: '',
          description: '',
          images: [],
          price: 0,
          costPerItem: 0,
          profitMargin: 0,
          sku: '',
          stockQuantity: 0,
          sellWhenOutOfStock: false,
          requiresShipping: true,
          weight: undefined,
          weightUnit: 'kg',
          length: undefined,
          width: undefined,
          height: undefined,
          categoryId: '',
          colorId: '',
          sizeId: '',
          isFeatured: false,
          isArchived: false,
        },
  });

  const addTax = () => {
    if (newTaxName && newTaxValue) {
      const newTax = {
        name: newTaxName,
        value: parseFloat(newTaxValue),
      };
      setTaxes([...taxes, newTax]);
      setNewTaxName('');
      setNewTaxValue('');
    }
  };

  const removeTax = (index: number) => {
    const newTaxes = taxes.filter((_, i) => i !== index);
    setTaxes(newTaxes);
  };

  // Calculate total price when cost, profit margin or taxes change
  useEffect(() => {
    const costPerItem = Number(form.getValues('costPerItem')) || 0;
    const profitMargin = Number(form.getValues('profitMargin')) || 0;
    
    const profit = (costPerItem * profitMargin) / 100;
    const basePrice = costPerItem + profit;
    
    const totalTax = taxes.reduce((acc, tax) => {
      return acc + (basePrice * tax.value) / 100;
    }, 0);

    const totalPrice = Number((basePrice + totalTax).toFixed(2));
    form.setValue('price', totalPrice);
  }, [form.watch('costPerItem'), form.watch('profitMargin'), taxes]);

  const onSubmit = async (data: ProductFormValues) => {
    try {
      setLoading(true);
      if (initialData) {
        await axios.patch(
          `/api/${params.storeId}/products/${params.productId}`,
          {
            ...data,
            taxes: JSON.stringify(taxes)
          }
        );
      } else {
        await axios.post(`/api/${params.storeId}/products`, {
          ...data,
          taxes: JSON.stringify(taxes)
        });
      }
      router.refresh();
      router.push(`/${params.storeId}/products`);
      toast.success(toastMessage);
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      
      // First check if the product has any orders
      const response = await axios.get(`/api/${params.storeId}/products/${params.productId}/check-orders`);
      const { hasOrders } = response.data;

      if (hasOrders) {
        toast.error('Cannot delete product with existing orders. Instead Archive the Product to hide it.');
        
        return;
      }

      await axios.delete(`/api/${params.storeId}/products/${params.productId}`);
      router.refresh();
      router.push(`/${params.storeId}/products`);
      toast.success('Product deleted.');
    } catch (error: any) {
      if (error.response?.status === 400) {
        toast.error('Make sure you removed all orders using this product first.');
      } else {
        toast.error('Something went wrong');
      }
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
      <div className='flex items-center justify-between'>
        <Heading title={title} description={description} />
        {initialData && (
          <Button
            disabled={loading}
            variant='destructive'
            size='sm'
            onClick={() => setOpen(true)}
          >
            <Trash className='h-4 w-4' />
          </Button>
        )}
      </div>
      <Separator />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-8 w-full'
        >
          <FormField
            control={form.control}
            name='images'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Images</FormLabel>
                <FormControl>
                  <ImageUpload
                    value={field.value.map((image) => image.url)}
                    disabled={loading}
                    onChange={(url) =>
                      field.onChange([...field.value, { url }])
                    }
                    onRemove={(url) =>
                      field.onChange([
                        ...field.value.filter((current) => current.url !== url),
                      ])
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className='grid grid-cols-3 gap-8'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder='Product name'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      disabled={loading}
                      placeholder='Product description'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='sku'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder='SKU'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='costPerItem'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost Per Item</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      disabled={loading}
                      placeholder='9.99'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='profitMargin'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profit Margin (%)</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      disabled={loading}
                      placeholder='20'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <FormLabel>Custom Taxes</FormLabel>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Tax name"
                    value={newTaxName}
                    onChange={(e) => setNewTaxName(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Tax value (%)"
                    value={newTaxValue}
                    onChange={(e) => setNewTaxValue(e.target.value)}
                  />
                  <Button
                    type="button"
                    onClick={addTax}
                    variant="secondary"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {taxes.map((tax, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="flex-1">
                      {tax.name}: {tax.value}%
                    </div>
                    <Button
                      type="button"
                      onClick={() => removeTax(index)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <FormField
              control={form.control}
              name='price'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Price</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      disabled={true}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='stockQuantity'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='categoryId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    disabled={loading}
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          defaultValue={field.value}
                          placeholder='Select a category'
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
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
              name='sizeId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Size</FormLabel>
                  <Select
                    disabled={loading}
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          defaultValue={field.value}
                          placeholder='Select a size'
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sizes.map((size) => (
                        <SelectItem key={size.id} value={size.id}>
                          {size.name}
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
              name='colorId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <Select
                    disabled={loading}
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          defaultValue={field.value}
                          placeholder='Select a color'
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {colors.map((color) => (
                        <SelectItem key={color.id} value={color.id}>
                          {color.name}
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
              name='weightUnit'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight Unit</FormLabel>
                  <Select
                    disabled={loading}
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          defaultValue={field.value}
                          placeholder='Select unit'
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="g">Grams (g)</SelectItem>
                      <SelectItem value="kg">Kilograms (kg)</SelectItem>
                      <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                      <SelectItem value="oz">Ounces (oz)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='weight'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      disabled={loading}
                      {...field}
                      value={field.value || ''}
                      onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className='grid grid-cols-3 gap-8'>
            <FormField
              control={form.control}
              name='length'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Length</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      disabled={loading}
                      {...field}
                      value={field.value || ''}
                      onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='width'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Width</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      disabled={loading}
                      {...field}
                      value={field.value || ''}
                      onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='height'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Height</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      disabled={loading}
                      {...field}
                      value={field.value || ''}
                      onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className='grid grid-cols-3 gap-8'>
            <FormField
              control={form.control}
              name='isFeatured'
              render={({ field }) => (
                <FormItem className='flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4'>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className='space-y-1 leading-none'>
                    <FormLabel>Featured</FormLabel>
                    <FormDescription>
                      Featured products will appear on the home page
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='isArchived'
              render={({ field }) => (
                <FormItem className='flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4'>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className='space-y-1 leading-none'>
                    <FormLabel>Archived</FormLabel>
                    <FormDescription>
                      Archived products will not appear in the store
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='sellWhenOutOfStock'
              render={({ field }) => (
                <FormItem className='flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4'>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className='space-y-1 leading-none'>
                    <FormLabel>Continue selling when out of stock</FormLabel>
                    <FormDescription>
                      Allow customers to purchase even when stock is 0
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='requiresShipping'
              render={({ field }) => (
                <FormItem className='flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4'>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className='space-y-1 leading-none'>
                    <FormLabel>Requires shipping</FormLabel>
                    <FormDescription>
                      This product needs to be shipped
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
          <Button disabled={loading} className='ml-auto' type='submit'>
            {action}
          </Button>
        </form>
      </Form>
    </>
  );
};