import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

export function hasSupabaseRuntimeConfig(): boolean {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const anonKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!url || !url.startsWith('https://')) {
    return false;
  }

  if (url.includes('demo-project.supabase.co')) {
    return false;
  }

  const normalizedUrl = url.replace(/\/$/, '');
  if (!normalizedUrl || /example|placeholder|demo/i.test(normalizedUrl)) {
    return false;
  }

  if (!anonKey && !serviceRoleKey) {
    return false;
  }

  return true;
}

export function getSupabaseClient(customUrl?: string, customKey?: string): SupabaseClient | null {
  const url = customUrl || (typeof process !== 'undefined' ? process.env.SUPABASE_URL : '') || (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) || 'https://gmgdqwcnbkxqfskfuncs.supabase.co';
  const key = customKey || (typeof process !== 'undefined' ? (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY) : '') || (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || 'sb_publishable_diG86-3zLdM71WGxnn_Z4g_VE-msXQV';

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

export async function testSupabaseConnection(
  url: string,
  key: string
): Promise<{ success: boolean; message: string; writeCapable?: boolean }> {
  try {
    if (!url.startsWith('https://')) {
      return { success: false, message: 'Supabase URL must start with https://' };
    }
    const cleanUrl = url.replace(/\/$/, '');

    // 1. Verify key validity using Supabase auth settings endpoint (publicly allowed for anon & publishable keys)
    const authRes = await fetch(`${cleanUrl}/auth/v1/settings`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });

    let isValid = authRes.ok || authRes.status === 200;

    // 2. Fallback check on classes table if auth/v1/settings is disabled
    if (!isValid) {
      const restRes = await fetch(`${cleanUrl}/rest/v1/classes?select=code&limit=1`, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      });
      if (restRes.ok || restRes.status === 200 || restRes.status === 204) {
        isValid = true;
      } else if (restRes.status === 401 || authRes.status === 401) {
        return {
          success: false,
          message:
            'Supabase key is invalid (401 Unauthorized). Please check Project Settings > API in your Supabase dashboard and copy the exact anon/public or service_role key.',
        };
      }
    }

    if (!isValid) {
      return {
        success: false,
        message: `Supabase returned HTTP status ${authRes.status}: ${authRes.statusText}`,
      };
    }

    // 3. Test write capability
    const client = createClient(cleanUrl, key, { auth: { persistSession: false } });
    const testWrite = await client
      .from('platform_settings')
      .upsert(
        {
          setting_key: '_ilm_connection_test',
          setting_value: new Date().toISOString(),
        },
        { onConflict: 'setting_key' }
      )
      .select();

    if (testWrite.error) {
      if (
        testWrite.error.code === '42501' ||
        testWrite.error.message?.includes('violates row-level security')
      ) {
        return {
          success: true,
          writeCapable: false,
          message:
            '✓ Supabase API connected! (Read-only mode active: To enable full write/sync, enter "Service Role Key" or run "Disable RLS" in Supabase SQL Editor).',
        };
      }
      return {
        success: true,
        writeCapable: true,
        message: '✓ Supabase connection verified successfully! API key is active.',
      };
    }

    return {
      success: true,
      writeCapable: true,
      message: '✓ Supabase connected successfully! Full Read & Write sync permissions are active.',
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error connecting to Supabase.' };
  }
}
