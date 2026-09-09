import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  role: z.enum(["STUDENT", "TEACHER"]),
  country: z.string().max(100).optional(),
});

export const teacherProfileSchema = z.object({
  headline: z.string().min(4).max(140),
  bio: z.string().min(20).max(4000),
  videoUrl: z.string().url().optional().or(z.literal("")),
  pricePerHour: z.coerce.number().min(1).max(1000),
  languageIds: z.array(z.string()).min(1),
  specialtyIds: z.array(z.string()).optional().default([]),
});

export const availabilitySchema = z.object({
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});

export const bookingSchema = z.object({
  availabilityId: z.string(),
});

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export const reportSchema = z.object({
  reviewId: z.string(),
  reason: z.string().min(5).max(1000),
});
