import { z } from "zod"

export const googleSchema = z.object({
    idToken: z.string().min(10)
})