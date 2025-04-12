'use client';

import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';

export type CustomerColumn = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: {
    city: string;
    state: string;
    country: string;
  };
  createdAt: string;
};

export const columns: ColumnDef<CustomerColumn>[] = [
  {
    accessorKey: 'fullName',
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
  },
  {
    accessorKey: 'address',
    header: 'Location',
    cell: ({ row }) => {
      const address = row.original.address;
      return `${address.city}, ${address.state}, ${address.country}`;
    }
  },
  {
    accessorKey: 'createdAt',
    header: 'Date',
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];