import Link from "next/link";
import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";

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
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Lingua<span className="text-indigo-600">Academy</span>
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
                className="rounded-md bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-500"
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
