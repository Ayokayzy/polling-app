import { createBrowserClient } from '@supabase/ssr';

// This client is for Client Components.
// It handles session storage in the browser.
export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
}
