'use client';

import axios from 'axios';
import { useState } from 'react';
import { Copy, Edit, MoreHorizontal, Trash, Eye, Archive, ArchiveRestore } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { ProductColumn } from './columns';
import { AlertModal } from '@/components/modals/alert-modal';

interface CellActionProps {
  data: ProductColumn;
}

export const CellAction = ({ data }: CellActionProps) => {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const onCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success('Product id copied to clipboard');
  };

  const onArchiveToggle = async () => {
    try {
      setLoading(true);
      await axios.patch(`/api/${params.storeId}/products/${data.id}`, {
        isArchived: !data.isArchived
      });
      router.refresh();
      toast.success(data.isArchived ? 'Product unarchived.' : 'Product archived.');
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
      const response = await axios.get(`/api/${params.storeId}/products/${data.id}/check-orders`);
      const { hasOrders } = response.data;

      if (hasOrders) {
        toast.error('Cannot delete product with existing orders. Instead Archive the Product to hide it.');
        setOpen(false);
        return;
      }

      await axios.delete(`/api/${params.storeId}/products/${data.id}`);
      router.refresh();
      toast.success('Product deleted.');
    } catch (error: any) {
      if (error.response?.status === 400) {
        toast.error('Cannot delete product with existing orders.');
      } else {
        toast.error('Something went wrong');
      }
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const onView = () => {
    window.open(`/${params.storeId}/products/${data.id}/view`, '_blank');
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onDelete}
        loading={loading}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Open Menu</span>
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onCopy(data.id)}>
            <Copy className='mr-2 h-4 w-4' />
            Copy Id
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onView()}>
            <Eye className='mr-2 h-4 w-4' />
            View
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              router.push(`/${params.storeId}/products/${data.id}`)
            }
          >
            <Edit className='mr-2 h-4 w-4' />
            Update
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onArchiveToggle} disabled={loading}>
            {data.isArchived ? (
              <>
                <ArchiveRestore className='mr-2 h-4 w-4' />
                Unarchive
              </>
            ) : (
              <>
                <Archive className='mr-2 h-4 w-4' />
                Archive
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <Trash className='mr-2 h-4 w-4' />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};