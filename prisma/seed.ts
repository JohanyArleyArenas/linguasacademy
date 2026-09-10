import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const LANGUAGES = [
  { code: "en", name: "Inglés" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Francés" },
  { code: "de", name: "Alemán" },
  { code: "it", name: "Italiano" },
  { code: "pt", name: "Portugués" },
  { code: "zh", name: "Chino mandarín" },
  { code: "ja", name: "Japonés" },
];

const SPECIALTIES = [
  "Conversación",
  "Negocios",
  "Preparación de examen",
  "Gramática intensiva",
  "Niños y adolescentes",
];

async function main() {
  for (const lang of LANGUAGES) {
    await prisma.language.upsert({
      where: { code: lang.code },
      update: {},
      create: lang,
    });
  }

  for (const name of SPECIALTIES) {
    await prisma.specialty.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const languages = await prisma.language.findMany();
  const specialties = await prisma.specialty.findMany();

  // Las cuentas de demostración comparten una contraseña pública, así que solo
  // se crean cuando se piden de forma explícita. Sembrarlas en un entorno real
  // entregaría el panel de administración a cualquiera que lea el README.
  if (process.env.SEED_DEMO_USERS !== "true") {
    console.log(
      "Idiomas y especialidades listos. Usuarios de demostración omitidos " +
        "(usa SEED_DEMO_USERS=true para crearlos en desarrollo)."
    );
    return;
  }

  const passwordHash = await bcrypt.hash("password123", 10);

  await prisma.user.upsert({
    where: { email: "admin@linguasacademy.test" },
    update: {},
    create: {
      email: "admin@linguasacademy.test",
      name: "Admin Lingua's Academy",
      passwordHash,
      role: "ADMIN",
    },
  });

  const student = await prisma.user.upsert({
    where: { email: "student@linguasacademy.test" },
    update: {},
    create: {
      email: "student@linguasacademy.test",
      name: "Sofía Estudiante",
      passwordHash,
      role: "STUDENT",
      studentProfile: { create: {} },
    },
  });
  await prisma.studentProfile.upsert({
    where: { userId: student.id },
    update: {},
    create: { userId: student.id },
  });

  const sampleTeachers = [
    {
      email: "maria@linguasacademy.test",
      name: "María González",
      headline: "Profesora nativa de español, especialista en conversación",
      bio: "Llevo 8 años enseñando español a estudiantes de todo el mundo. Mis clases son dinámicas y adaptadas a tus objetivos.",
      pricePerHour: 15,
      langCodes: ["es"],
      specialtyNames: ["Conversación", "Preparación de examen"],
    },
    {
      email: "john@linguasacademy.test",
      name: "John Smith",
      headline: "Profesor certificado de inglés de negocios",
      bio: "Ex consultor internacional, ahora enseño inglés enfocado en negocios y entrevistas de trabajo.",
      pricePerHour: 22,
      langCodes: ["en"],
      specialtyNames: ["Negocios", "Gramática intensiva"],
    },
    {
      email: "chloe@linguasacademy.test",
      name: "Chloé Dubois",
      headline: "Profesora de francés apasionada por la cultura",
      bio: "Clases amenas con enfoque en pronunciación y cultura francesa. Todos los niveles bienvenidos.",
      pricePerHour: 18,
      langCodes: ["fr"],
      specialtyNames: ["Conversación", "Niños y adolescentes"],
    },
    {
      email: "hans@linguasacademy.test",
      name: "Hans Müller",
      headline: "Alemán práctico para la vida diaria y el trabajo",
      bio: "Metodología estructurada basada en el marco común europeo. Preparación para exámenes oficiales.",
      pricePerHour: 20,
      langCodes: ["de"],
      specialtyNames: ["Preparación de examen", "Gramática intensiva"],
    },
  ];

  for (const t of sampleTeachers) {
    const user = await prisma.user.upsert({
      where: { email: t.email },
      update: {},
      create: {
        email: t.email,
        name: t.name,
        passwordHash,
        role: "TEACHER",
      },
    });

    const teacherLangs = languages.filter((l) => t.langCodes.includes(l.code));
    const teacherSpecs = specialties.filter((s) =>
      t.specialtyNames.includes(s.name)
    );

    const profile = await prisma.teacherProfile.upsert({
      where: { userId: user.id },
      update: {
        headline: t.headline,
        bio: t.bio,
        pricePerHour: t.pricePerHour,
        status: "APPROVED",
      },
      create: {
        userId: user.id,
        headline: t.headline,
        bio: t.bio,
        pricePerHour: t.pricePerHour,
        status: "APPROVED",
      },
    });

    for (const lang of teacherLangs) {
      await prisma.teacherLanguage.upsert({
        where: { teacherId_languageId: { teacherId: profile.id, languageId: lang.id } },
        update: {},
        create: { teacherId: profile.id, languageId: lang.id, level: "Nativo" },
      });
    }

    for (const spec of teacherSpecs) {
      await prisma.teacherSpecialty.upsert({
        where: {
          teacherId_specialtyId: { teacherId: profile.id, specialtyId: spec.id },
        },
        update: {},
        create: { teacherId: profile.id, specialtyId: spec.id },
      });
    }

    const existingSlots = await prisma.availability.count({
      where: { teacherId: profile.id },
    });

    if (existingSlots === 0) {
      const now = new Date();
      for (let day = 1; day <= 5; day++) {
        for (const hour of [9, 15, 18]) {
          const startsAt = new Date(now);
          startsAt.setDate(now.getDate() + day);
          startsAt.setHours(hour, 0, 0, 0);
          const endsAt = new Date(startsAt);
          endsAt.setHours(hour + 1);

          await prisma.availability.create({
            data: { teacherId: profile.id, startsAt, endsAt },
          });
        }
      }
    }
  }

  console.log("Seed completado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
