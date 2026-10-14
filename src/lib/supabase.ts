import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

export function getSupabaseClient(customUrl?: string, customKey?: string): SupabaseClient | null {
  const url = customUrl || (typeof process !== 'undefined' ? process.env.SUPABASE_URL : '') || (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) || '';
  const key = customKey || (typeof process !== 'undefined' ? (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY) : '') || (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || '';

  if (!url || !key) {
    return null;
  }

  if (cachedClient && cachedUrl === url && cachedKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    cachedUrl = url;
    cachedKey = key;
    return cachedClient;
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
}

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!url.startsWith('https://')) {
      return { success: false, message: 'Supabase URL must start with https://' };
    }
    const client = createClient(url, key, {
      auth: { persistSession: false },
    });
    // Check if we can ping the Supabase REST endpoint
    const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });
    if (res.ok || res.status === 200 || res.status === 404) {
      return { success: true, message: 'Supabase API connection successful! Ready to sync.' };
    }
    return { success: false, message: `Supabase returned HTTP status ${res.status}: ${res.statusText}` };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error connecting to Supabase.' };
  }
}
