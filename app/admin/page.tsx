import Recruitment from '../recruitment';
import { getAdmin } from '../../lib/admin';
import { redirect } from 'next/navigation';
import { supabaseConfigured } from '../../lib/supabase';
export const dynamic='force-dynamic';
export default async function AdminPage() {
  const admin=await getAdmin();
  if(!admin)redirect('/admin/login');
  return <Recruitment adminEmail={admin.email} databaseReady={supabaseConfigured()} company={admin.company}/>;
}
