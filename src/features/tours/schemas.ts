import { z } from "zod";

export const createTourSchema = z.object({
  name: z.string().min(1, "Name is required").max(120, "Name is too long"),
});
export type CreateTourValues = z.infer<typeof createTourSchema>;
