import type { ZodError } from "zod";

export function parseFormError<F extends Record<string, unknown>>(
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
  T extends Record<string, unknown>,
  D extends keyof T & string,
  K extends T[D] & string,
  F extends Extract<T, Record<D, K>>,
  Result extends {
    [Key in Exclude<keyof F, D>]: string | null;
  },
>(params: {
  formError: ZodError<T>;
  discriminant: {
    name: D;
    value: K;
  };
}): Result {
  const { formError } = params;

  const flattened = (formError as ZodError<Record<string, unknown>>).flatten();

  type Variant = Extract<T, Record<D, K>>;
  type Field = Exclude<keyof Variant, D> & string;

  const result: Partial<Record<Field, string | null>> = {};

  for (const field of Object.keys({} as Omit<Variant, D>) as Field[]) {
    result[field] = flattened.fieldErrors[field]?.[0] ?? null;
  }

  return result as Result;
}
