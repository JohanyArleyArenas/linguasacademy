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

En cualquier momento, estudiante y profesor pueden escribirse desde el perfil
del profesor (`Enviar mensaje`). Las conversaciones viven en
`/dashboard/messages`, con indicador de mensajes no leídos en la barra
superior. Solo los participantes de una conversación pueden leerla o
escribir en ella.

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

4. Carga los datos de ejemplo, incluidas las cuentas de demostración:

   ```bash
   npm run db:seed:demo
   ```

   `npm run db:seed` (sin `:demo`) carga solo idiomas y especialidades. Las
   cuentas de demostración quedan detrás de `SEED_DEMO_USERS=true` a
   propósito: comparten una contraseña pública e incluyen un administrador,
   así que nunca deben sembrarse en un entorno real.

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

## Publicar en internet

La app es un proyecto Next.js con PostgreSQL, así que necesita dos cosas: un
hosting que ejecute Node y una base de datos accesible desde ese hosting. La
ruta más corta es Vercel (creado por el mismo equipo que Next.js) con una base
de datos gestionada.

1. **Crea la base de datos.** En [Neon](https://neon.tech),
   [Supabase](https://supabase.com) o Vercel Postgres. Todas tienen plan
   gratuito. Copia la cadena de conexión que te den.

2. **Importa el repositorio en [Vercel](https://vercel.com/new)** y conéctalo
   a esta rama de GitHub.

3. **Define las variables de entorno** en Vercel (*Settings → Environment
   Variables*):

   - `DATABASE_URL`: la cadena del paso 1.
   - `AUTH_SECRET`: genérala con `openssl rand -base64 32`.

   En Vercel no definas `AUTH_URL`: se detecta sola y así los despliegues de
   vista previa siguen funcionando. En cualquier otro hosting sí es
   obligatoria (ver `.env.example`).

4. **Despliega.** El script de build ya ejecuta `prisma migrate deploy`, así
   que las tablas se crean solas en el primer despliegue. El `postinstall`
   ejecuta `prisma generate`, necesario porque el hosting cachea
   `node_modules` y sin él el cliente de Prisma queda desactualizado.

5. **Carga los idiomas y especialidades** una sola vez, apuntando a la base de
   datos de producción:

   ```bash
   DATABASE_URL="<tu cadena de producción>" npm run db:seed
   ```

   Usa `db:seed`, nunca `db:seed:demo`: las cuentas de demostración tienen
   contraseña pública e incluyen un administrador.

6. **Crea tu cuenta de administrador.** Regístrate desde la web y luego
   promueve ese usuario:

   ```sql
   UPDATE "User" SET role = 'ADMIN' WHERE email = 'tu@correo.com';
   ```

Antes de aceptar usuarios reales, ten en cuenta que los pagos son simulados:
`/api/payments/[id]/confirm` marca la reserva como pagada sin cobrar nada.

## Próximos pasos sugeridos

- Entrega en tiempo real de los mensajes (hoy el hilo se actualiza al enviar
  o al recargar; falta websockets o polling).
- Integración de videollamadas.
- Integración de pagos reales (Stripe) y comisiones de la plataforma.
- Notificaciones por correo/push (el modelo `Notification` ya existe).
- Recomendaciones de profesores basadas en preferencias del estudiante.
