import Link from "next/link";

const tabs = [
  { href: "/dashboard/admin", label: "Resumen" },
  { href: "/dashboard/admin/teachers", label: "Profesores" },
  { href: "/dashboard/admin/students", label: "Estudiantes" },
  { href: "/dashboard/admin/languages", label: "Idiomas" },
  { href: "/dashboard/admin/bookings", label: "Reservas y pagos" },
  { href: "/dashboard/admin/withdrawals", label: "Retiros" },
  { href: "/dashboard/admin/reports", label: "Reportes" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold text-neutral-900">
        Panel de administración
      </h1>
      <nav className="mt-6 flex flex-wrap gap-2 border-b border-neutral-200 pb-3">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="rounded-md px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <div className="mt-8">{children}</div>
    </div>
  );
}
