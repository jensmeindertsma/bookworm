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

export function getFormErrors<
  T extends { kind: string },
  K extends T["kind"],
  F extends Exclude<keyof Extract<T, { kind: K }> & string, "kind">,
>({
  formError,
}: {
  formError: ZodError<T>;
  kind: K;
}): Record<F, string | null> {
  const flattened = (formError as ZodError<Record<string, unknown>>).flatten();

  type Variant = Extract<T, { kind: K }>;
  type Fields = Exclude<keyof Variant & string, "kind">;

  const errors = {} as Record<Fields, string | null>;

  for (const field of Object.keys(flattened.fieldErrors) as Fields[]) {
    errors[field] =
      (formError as ZodError<Record<string, unknown>>).flatten().fieldErrors[
        field
      ]?.[0] ?? null;
  }

  (Object.keys(errors) as Fields[]).forEach((field) => {
    if (!(field in errors)) {
      errors[field] = null;
    }
  });

  return errors;
}
