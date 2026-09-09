import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudentProfile } from "@/lib/session-guards";
import { formatDateTime, formatPrice } from "@/lib/format";
import { PayButton } from "@/components/pay-button";

export default async function CheckoutPage({
  params,
}: PageProps<"/checkout/[id]">) {
  const { id } = await params;
  const studentProfile = await requireStudentProfile();
  if (!studentProfile) redirect("/login");

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      teacher: { include: { user: true } },
      availability: true,
      payment: true,
    },
  });

  if (!booking || booking.studentId !== studentProfile.id) notFound();

  if (booking.payment?.status === "PAID") {
    redirect("/dashboard/student");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold text-neutral-900">
        Confirma tu reserva
      </h1>

      <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-5">
        <p className="font-medium text-neutral-900">
          Clase con {booking.teacher.user.name}
        </p>
        <p className="mt-1 text-sm text-neutral-600">
          {formatDateTime(booking.availability.startsAt)}
        </p>
        <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4">
          <span className="text-sm text-neutral-600">Total a pagar</span>
          <span className="text-lg font-semibold text-neutral-900">
            {formatPrice(booking.priceCents / 100)}
          </span>
        </div>
      </div>

      <p className="mt-4 text-xs text-neutral-500">
        Este es un pago simulado con fines de demostración. No se procesará
        ningún cargo real.
      </p>

      <div className="mt-6">
        <PayButton bookingId={booking.id} />
      </div>
    </div>
  );
}
