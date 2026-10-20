import CandidateForm from '../candidate-form';
import { supabaseConfigured } from '../../lib/supabase';
export const dynamic = 'force-dynamic';
export default function ApplicationPage() {
  return <CandidateForm ready={supabaseConfigured()}/>;
}
