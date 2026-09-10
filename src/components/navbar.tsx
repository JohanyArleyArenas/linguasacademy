import Link from "next/link";
import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";
import { Logo } from "@/components/logo";

const dashboardByRole: Record<string, string> = {
  STUDENT: "/dashboard/student",
  TEACHER: "/dashboard/teacher",
  ADMIN: "/dashboard/admin",
};

export async function Navbar() {
  const session = await auth();

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-9 w-9" />
          <span className="text-lg font-semibold tracking-tight">
            Lingua&apos;s <span className="text-emerald-600">Academy</span>
          </span>
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link href="/teachers" className="text-neutral-600 hover:text-neutral-900">
            Encontrar profesor
          </Link>

          {session?.user ? (
            <>
              <Link
                href={dashboardByRole[session.user.role]}
                className="text-neutral-600 hover:text-neutral-900"
              >
                Mi panel
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="text-neutral-600 hover:text-neutral-900">
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-emerald-600 px-3 py-1.5 font-medium text-white hover:bg-emerald-500"
              >
                Regístrate
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
