const env = process.env;

export function supabaseConfigured(): boolean {
  const key=env.SUPABASE_SECRET_KEY || '';
  return Boolean(env.SUPABASE_URL && (key.startsWith('sb_secret_') || key.split('.').length===3));
}

export async function supabaseRequest(path: string, init: RequestInit = {}): Promise<Response> {
  if (!supabaseConfigured()) throw new Error('Supabase no está configurado.');
  const base = new URL(env.SUPABASE_URL!);
  if (base.protocol !== 'https:' || base.pathname !== '/' || base.search || base.hash || base.username || base.password) {
    throw new Error('La URL de Supabase no es válida.');
  }
  const key = env.SUPABASE_SECRET_KEY!;
  const headers = new Headers(init.headers);
  headers.set('apikey', key);
  // Legacy service_role keys are JWTs; new sb_secret keys use only apikey.
  if (!key.startsWith('sb_secret_')) headers.set('Authorization', 'Bearer ' + key);
  return fetch(new URL(path, base), {...init, headers, cache:'no-store', redirect:'error', signal:AbortSignal.timeout(20000)});
}
