import type { ZodError } from "zod";

export function convertFormError<F extends Record<string, unknown>>(
  error: ZodError<F>,
): { [K in keyof F]: string | null } {
  const allKeys = Object.keys(error.flatten().fieldErrors) as Array<keyof F>;
  const result = Object.fromEntries(allKeys.map((key) => [key, null])) as {
    [K in keyof F]: string | null;
  };

  for (const issue of error.errors) {
    const key = issue.path[0];
    if (typeof key === "string" && key in result) {
      result[key as keyof F] = issue.message;
    }
  }

  return result;
}

export function getFieldError<
  T extends { kind: string },
  K extends T["kind"],
  F extends Exclude<keyof Extract<T, { kind: K }> & string, "kind">,
>({
  formError,
  field,
}: {
  formError: ZodError<T>;
  kind: K;
  field: F;
}): string | null {
  return (
    (formError as ZodError<Record<string, unknown>>).flatten().fieldErrors[
      field
    ]?.[0] ?? null
  );
}
