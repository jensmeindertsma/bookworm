import type { ZodError } from "zod";

export function convertValidationError<F extends Record<string, unknown>>(
  error: ZodError<F>,
): { [K in keyof F]: string | null } {
  const result = {} as { [K in keyof F]: string | null };

  for (const issue of error.errors) {
    const path = issue.path[0];
    if (typeof path === "string" && !(path in result)) {
      result[path as keyof F] = issue.message;
    }
  }

  for (const key in error.flatten().fieldErrors) {
    if (!(key in result)) {
      result[key as keyof F] = null;
    }
  }

  return result;
}
