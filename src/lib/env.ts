// ============================================================
// Environment Variable Validation
// ============================================================

interface EnvConfig {
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
  isSupabaseConfigured: boolean;
  adminEmail: string;
  adminPassword: string;
}

function validateEnv(): EnvConfig {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const placeholders = [
    'https://your-project.supabase.co',
    'your-anon-key-here',
  ];

  const hasUrl = supabaseUrl.length > 0 && !placeholders.includes(supabaseUrl);
  const hasKey = supabaseAnonKey.length > 0 && !placeholders.includes(supabaseAnonKey);

  const isSupabaseConfigured = hasUrl && hasKey;

  if (!isSupabaseConfigured) {
    console.warn(
      '%c⚠️ Supabase not configured — using localStorage fallback',
      'color: #f59e0b; font-weight: bold',
    );
    console.info(
      'To use Supabase:\n' +
      '  1. Copy .env.example to .env\n' +
      '  2. Add your Supabase URL and Anon Key\n' +
      '  3. Restart the dev server',
    );
  }

  const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase();
  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || '';

  return {
    supabaseUrl: hasUrl ? supabaseUrl : null,
    supabaseAnonKey: hasKey ? supabaseAnonKey : null,
    isSupabaseConfigured,
    adminEmail,
    adminPassword,
  };
}

export const env = validateEnv();
