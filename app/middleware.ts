import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
    // Check if the user is logged in
    const isLoggedIn = request.cookies.has('user_session');

    // If path is home and user is not logged in, redirect to login
    if (request.nextUrl.pathname === '/' && !isLoggedIn) {
        // You could redirect to a /login page if you have one, or
        // we'll just add a query param that the page can use
        return NextResponse.rewrite(new URL('/?auth=false', request.url));
    }

    return NextResponse.next();
}

// Configure middleware to run only on the homepage
export const config = {
    matcher: ['/'],
};