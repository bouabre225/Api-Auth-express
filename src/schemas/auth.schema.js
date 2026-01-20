import { z } from "zod"

export const registerSchema = z.object({
    email: z.string().email('email invalide'),
    password: z.string().min(8, "Minimum 8 caracteres"),
    firstName: z.string().min(2),
    lastName: z.string().min(2)
})

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    twoFactorToken: z.string().length(6).optional()
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(10)
})

export const logoutSchema = z.object({
  refreshToken: z.string().min(10)
})