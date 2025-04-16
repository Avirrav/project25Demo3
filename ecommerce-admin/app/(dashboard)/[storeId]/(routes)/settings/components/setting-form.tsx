'use client';

import * as z from 'zod';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { Store, Billboard } from '@prisma/client';
import { Trash } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useDebounce } from '@/hooks/use-debounce';

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
import { AlertModal } from '@/components/modals/alert-modal';
import { ApiAlert } from '@/components/ui/api-alert';
import { useOrigin } from '@/hooks/user-origin';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SettingFormProps {
  initialData: Store & {
    homeBillboard: Billboard | null;
  };
  billboards: Billboard[];
}

const formSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(1),
  apiUrl: z.string().min(1),
  homeBillboardId: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof formSchema>;

export const SettingForm = ({ initialData, billboards }: SettingFormProps) => {
  const params = useParams();
  const router = useRouter();
  const origin = useOrigin();
  
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData.name,
      username: initialData.username || '',
      apiUrl: initialData.apiUrl || '',
      homeBillboardId: initialData.homeBillboard?.id || undefined,
    },
  });

  const username = form.watch('username');
  const debouncedUsername = useDebounce(username, 500);

  useEffect(() => {
    const checkUsername = async () => {
      try {
        if (debouncedUsername && debouncedUsername !== initialData.username) {
          const response = await axios.get(`/api/stores/check-username?username=${debouncedUsername}&storeId=${params.storeId}`);
          setUsernameAvailable(response.data.available);
          
          if (!response.data.available) {
            form.setError('username', {
              type: 'manual',
              message: 'Username is already taken'
            });
          } else {
            form.clearErrors('username');
          }
        }
      } catch (error) {
        console.error('Error checking username:', error);
      }
    };

    checkUsername();
  }, [debouncedUsername, form, initialData.username, params.storeId]);

  const onSubmit = async (data: SettingsFormValues) => {
    try {
      setLoading(true);
      await axios.patch(`/api/stores/${params.storeId}`, data);
      router.refresh();
      toast.success('Store updated.');
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/stores/${params.storeId}`);
      router.refresh();
      router.push('/');
      toast.success('Store deleted.');
    } catch (error) {
      toast.error('Make sure you removed all products and categories first.');
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
        <Heading title='Settings' description='Manage store preferences' />
        <Button
          disabled={loading}
          variant='destructive'
          size='sm'
          onClick={() => setOpen(true)}
        >
          <Trash className='h-4 w-4' />
        </Button>
      </div>
      <Separator />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-8 w-full'
        >
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
                      placeholder='Store name'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='username'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        disabled={loading}
                        placeholder='Store username'
                        {...field}
                      />
                      {debouncedUsername && debouncedUsername !== initialData.username && (
                        <div className="absolute right-2 top-2 text-sm">
                          {usernameAvailable === true && (
                            <span className="text-green-500">Available</span>
                          )}
                          {usernameAvailable === false && (
                            <span className="text-red-500">Taken</span>
                          )}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='apiUrl'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API URL</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder='API URL'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='homeBillboardId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Home Billboard</FormLabel>
                  <Select
                    disabled={loading}
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a billboard for homepage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {billboards.map((billboard) => (
                        <SelectItem key={billboard.id} value={billboard.id}>
                          {billboard.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button disabled={loading} className='ml-auto' type='submit'>
            Save changes
          </Button>
        </form>
      </Form>
      <Separator />
      <ApiAlert
        title='NEXT_PUBLIC_API_URL'
        description={`${origin}/api/${params.storeId}`}
        variant={'public'}
      />
    </>
  );
};