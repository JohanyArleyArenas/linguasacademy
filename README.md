# Lingua's Academy

MVP de una plataforma de clases de idiomas al estilo Preply/italki: estudiantes
encuentran profesores, reservan y pagan clases, y valoran su experiencia;
profesores gestionan su perfil, disponibilidad e ingresos; administradores
moderan la plataforma.

## Flujo principal (golden path)

1. Un profesor se registra, completa su perfil (bio, idiomas, especialidades,
   precio) y publica disponibilidad. El perfil queda `PENDING` hasta que un
   admin lo aprueba.
2. Un administrador aprueba el perfil desde `/dashboard/admin/teachers`.
3. Un estudiante se registra, busca profesores por idioma/precio/especialidad
   en `/teachers`, ve el perfil y reserva un horario disponible.
4. La reserva pasa a checkout, donde el estudiante confirma un pago simulado
   (`/checkout/[id]`). Al pagar, la reserva queda `CONFIRMED` y se acredita el
   saldo del profesor.
5. El profesor marca la clase como impartida desde su panel; la reserva pasa a
   `COMPLETED`.
6. El estudiante deja una reseña desde su panel. Otros usuarios pueden
   reportar reseñas inapropiadas; un admin puede ocultarlas.
7. El profesor solicita un retiro de su saldo; un admin lo aprueba y marca
   como pagado.

## Stack

- **Frontend/Backend**: Next.js (App Router) + TypeScript + Tailwind CSS
- **Base de datos**: PostgreSQL + Prisma ORM
- **Autenticación**: Auth.js (NextAuth v5) con credenciales y roles
  (`STUDENT`, `TEACHER`, `ADMIN`)
- **Pagos**: pago simulado (stub) — listo para integrar Stripe u otro
  proveedor real en `src/app/api/payments/[id]/confirm/route.ts`

## Modelo de datos

Ver `prisma/schema.prisma`. Resumen:

- `User` (con `role`) → `StudentProfile` | `TeacherProfile`
- `Language`, `Specialty` y sus tablas de unión con `TeacherProfile`
- `Availability` → `Booking` → `Payment`/`Transaction`, `Lesson`, `Review`
- `Favorite`, `Conversation`/`Message`, `Withdrawal`, `Report`,
  `Notification`

## Desarrollo local

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Copia `.env.example` a `.env` y ajusta `DATABASE_URL` a tu instancia de
   PostgreSQL local.

3. Aplica las migraciones y genera el cliente de Prisma:

   ```bash
   npx prisma migrate dev
   ```

4. Carga datos de ejemplo (idiomas, especialidades, un admin, un estudiante y
   varios profesores aprobados con disponibilidad):

   ```bash
   npm run db:seed
   ```

   Credenciales de ejemplo (contraseña `password123` para todas):
   - `admin@linguasacademy.test` (admin)
   - `student@linguasacademy.test` (estudiante)
   - `maria@linguasacademy.test`, `john@linguasacademy.test`,
     `chloe@linguasacademy.test`, `hans@linguasacademy.test` (profesores
     aprobados)

5. Levanta el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   Abre [http://localhost:3000](http://localhost:3000).

## Próximos pasos sugeridos

- Mensajería en tiempo real entre estudiante y profesor (el modelo de datos
  ya existe: `Conversation`/`Message`).
- Integración de videollamadas.
- Integración de pagos reales (Stripe) y comisiones de la plataforma.
- Notificaciones por correo/push (el modelo `Notification` ya existe).
- Recomendaciones de profesores basadas en preferencias del estudiante.
