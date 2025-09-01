import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options) {
                    request.cookies.set({ name, value, ...options });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({ name, value, ...options });
                },
                remove(name: string, options) {
                    request.cookies.set({ name, value: "", ...options });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({ name, value: "", ...options });
                },
            },
        }
    );

    return { supabase, response };
}

export async function middleware(request: NextRequest) {
    const { supabase, response } = await updateSession(request);

    const {
        data: { session },
    } = await supabase.auth.getSession();

    const { pathname } = request.nextUrl;

    const publicPaths = ["/login", "/signup"]; // make sure it's "/signup" not "/register"
    const isPublic = publicPaths.includes(pathname);

    // Redirect unauthenticated users
    if (!session && !isPublic) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirectedFrom", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Redirect logged-in users away from login/signup
    if (session && ["/login", "/signup"].includes(pathname)) {
        return NextResponse.redirect(new URL("/polls", request.url));
    }

    return response;
}

export const config = {
    matcher: ["/polls/:path*"], // ✅ middleware only runs for protected routes
};
