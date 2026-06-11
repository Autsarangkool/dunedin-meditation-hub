import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  console.log("========== MIDDLEWARE ==========");
  console.log("PATH:", request.nextUrl.pathname);

  const isLoginPage = request.nextUrl.pathname.startsWith("/login");

  const cookies = request.cookies.getAll();

  console.log(
    "COOKIES:",
    cookies.map((c) => c.name)
  );

  const hasSupabaseSession = cookies.some(
    (cookie) => cookie.name.startsWith("sb-")
  );

  console.log("HAS SESSION:", hasSupabaseSession);

  if (!hasSupabaseSession && !isLoginPage) {
    console.log("➡️ REDIRECT TO LOGIN");

    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  if (hasSupabaseSession && isLoginPage) {
    console.log("➡️ REDIRECT TO HOME");

    return NextResponse.redirect(
      new URL("/", request.url)
    );
  }

  console.log("➡️ NEXT");

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};