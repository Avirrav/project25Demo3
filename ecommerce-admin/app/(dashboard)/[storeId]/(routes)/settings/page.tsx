import prismadb from '@/lib/prismadb';
import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { SettingForm } from './components/setting-form';

interface SettingsPageProps {
  params: { storeId: string };
}

const SettingsPage = async ({ params }: SettingsPageProps) => {
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const store = await prismadb.store.findFirst({
    where: {
      id: params.storeId,
      userId,
    },
    include: {
      homeBillboard: true
    }
  });

  if (!store) {
    redirect('/');
  }

  const billboards = await prismadb.billboard.findMany({
    where: {
      storeId: params.storeId
    }
  });

  return (
    <div className='flex-col'>
      <div className='flex-1 space-y-4 p-8 pt-6 '>
        <SettingForm initialData={store} billboards={billboards} />
      </div>
    </div>
  );
};

export default SettingsPage;