import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(120, "Name is too long"),
  description: z.string().max(500, "Description is too long").optional(),
});
export type CreateProjectValues = z.infer<typeof createProjectSchema>;

export const projectSiteUrlSchema = z.object({
  siteUrl: z.string().min(1, "URL is required").url("Enter a valid URL, e.g. https://yourapp.com"),
});
export type ProjectSiteUrlValues = z.infer<typeof projectSiteUrlSchema>;
