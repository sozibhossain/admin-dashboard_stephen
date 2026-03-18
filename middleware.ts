import { auth } from "@/auth";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user;
  const isAllowedDashboardUser =
    session?.user?.role === "admin" &&
    String(session?.user?.category ?? "").trim().toLowerCase() === "construction";
  const isAuthPage =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/forgot-password") ||
    nextUrl.pathname.startsWith("/verify-otp") ||
    nextUrl.pathname.startsWith("/reset-password");

  if (isLoggedIn && !isAllowedDashboardUser && !isAuthPage) {
    return Response.redirect(new URL("/login", nextUrl));
  }

  if (!isLoggedIn && !isAuthPage) {
    return Response.redirect(new URL("/login", nextUrl));
  }

  if (isLoggedIn && isAllowedDashboardUser && isAuthPage) {
    return Response.redirect(new URL("/dashboard", nextUrl));
  }

  return undefined;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};

