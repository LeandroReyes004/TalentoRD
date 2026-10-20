import { notFound } from 'next/navigation';
import CandidateForm from '../../candidate-form';
import { findCompany } from '../../../lib/companies';
export const dynamic='force-dynamic';
export default async function CompanyApplication({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;if(!/^[a-z0-9-]{2,71}$/.test(slug))notFound();
 const company=await findCompany('slug',slug);if(!company)notFound();
 return <CandidateForm ready company={company}/>;
}
