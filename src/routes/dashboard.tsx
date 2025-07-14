import type { Route } from "./+types/dashboard";
import { database } from "~/services/database.server";
import { getFormErrors } from "~/services/form.server";
import { verifySession } from "~/services/session.server";
import { useEffect, useRef } from "react";
import { data, Form, redirect, useNavigation } from "react-router";
import z from "zod";

export default function Dashboard({
  loaderData,
  actionData: feedback,
}: Route.ComponentProps) {
  const navigation = useNavigation();
  const addFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (navigation.state === "idle") {
      addFormRef.current?.reset();
    }
  }, [navigation.state]);

  const sectionStyle = "flex flex-col mb-2";
  const labelStyle = "mb-1 underline";
  const inputStyle =
    "text-black dark:text-white italic placeholder:text-gray-400 placeholder:italic";
  const errorStyle = "mt-2 underline decoration-red-600";
  const buttonStyle =
    "mt-2 w-30 bg-black p-2 text-center text-white dark:bg-white dark:text-black";

  return (
    <>
      <p className="mb-2">Logged in as {loaderData.name}.</p>
      <p>You are currently reading {loaderData.books.length} books.</p>

      <hr className="my-8 border-t-2 border-black dark:border-white" />

      <Form method="post" ref={addFormRef}>
        <input type="hidden" name="token" value={loaderData.token} />
        <input type="hidden" name="intent" value="create" />

        <h2 className="mb-2 text-xl">Add a new book</h2>

        <section className={sectionStyle}>
          <label htmlFor="name" className={labelStyle}>
            Name
          </label>
          <input
            type="text"
            required
            id="name"
            name="name"
            minLength={2}
            className={inputStyle}
            placeholder="Tommy's great adventure"
          />
          <p className={errorStyle}>
            {feedback?.form === "create" && feedback.name}
          </p>
        </section>

        <section className={sectionStyle}>
          <label htmlFor="pageCount" className={labelStyle}>
            Page Count
          </label>
          <input
            type="number"
            required
            id="pageCount"
            name="pageCount"
            className={inputStyle}
            placeholder="123"
          />
          <p className={errorStyle}>
            {feedback?.form === "create" && feedback.name}
          </p>
        </section>

        <button type="submit" className={buttonStyle}>
          Add new book
        </button>
      </Form>

      <ul>
        {loaderData.books.map((book) => (
          <li key={book.id}>
            <hr className="my-8 border-t-2 border-black dark:border-white" />
            <p className="text-xl">{book.name}</p>
            <p>
              (currently on page {book.progress}/{book.pageCount})
            </p>
            <Form method="post">
              <input type="hidden" name="token" value={loaderData.token} />
              <input type="hidden" name="intent" value="saveProgress" />
              <input type="hidden" name="id" value={book.id} />

              <label htmlFor="progress">Save Progress</label>
              <input
                type="number"
                required
                id="progress"
                name="progress"
                placeholder={book.progress.toString()}
              />

              <button type="submit" className={buttonStyle}>
                Save progress
              </button>
            </Form>
            {feedback?.form === "saveDetails" && feedback.id === book.id ? (
              <Form method="post">
                <input type="hidden" name="token" value={loaderData.token} />
                <input type="hidden" name="intent" value="saveDetails" />
                <input type="hidden" name="id" value={book.id} />

                <section className={sectionStyle}>
                  <label htmlFor="name" className={labelStyle}>
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    minLength={2}
                    className={inputStyle}
                    defaultValue={book.name}
                  />
                  <p className={errorStyle}>
                    {feedback?.form === "saveDetails" && feedback.name}
                  </p>
                </section>

                <section className={sectionStyle}>
                  <label htmlFor="pageCount" className={labelStyle}>
                    Page Count
                  </label>
                  <input
                    type="number"
                    id="pageCount"
                    name="pageCount"
                    className={inputStyle}
                    defaultValue={String(book.pageCount)}
                  />
                  <p className={errorStyle}>
                    {feedback?.form === "saveDetails" && feedback.pageCount}
                  </p>
                </section>

                <button
                  type="submit"
                  name="intent"
                  value="cancel"
                  className={buttonStyle}
                >
                  Cancel
                </button>
                <button type="submit" className={buttonStyle}>
                  Save Details
                </button>
              </Form>
            ) : (
              <Form method="post">
                <input type="hidden" name="token" value={loaderData.token} />
                <input type="hidden" name="intent" value="editDetails" />
                <input type="hidden" name="id" value={book.id} />

                <button type="submit" className={buttonStyle}>
                  Edit Details
                </button>
              </Form>
            )}
            {feedback?.form === "confirmDelete" ? (
              <Form method="post">
                <input type="hidden" name="token" value={loaderData.token} />
                <input type="hidden" name="id" value={book.id} />

                <button
                  type="submit"
                  name="intent"
                  value="cancel"
                  className={buttonStyle}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  name="intent"
                  value="confirmDelete"
                  className={buttonStyle}
                >
                  Confirm
                </button>
              </Form>
            ) : (
              <Form method="post">
                <input type="hidden" name="token" value={loaderData.token} />
                <input type="hidden" name="intent" value="delete" />
                <input type="hidden" name="id" value={book.id} />

                <button type="submit" className={buttonStyle}>
                  Delete Book
                </button>
              </Form>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await verifySession({
    request,
    redirectTo: "/signin",
  });

  const user = await database.user.findUnique({
    where: { id: session.id },
    select: { books: true, name: true },
  });

  if (!user) {
    throw session.destroy({ redirectTo: "/signin" });
  }

  const { token, headers } = await session.getToken();

  return data(
    {
      name: user.name,
      books: user.books,
      token,
    },
    { headers },
  );
}

export async function action({ request }: Route.ActionArgs) {
  const session = await verifySession({
    request,
    redirectTo: "/signin",
  });

  const formData = await request.formData();

  session.verifyToken({ formData });

  const { error: intentError, data: intent } = z
    .enum([
      "create",
      "saveProgress",
      "editDetails",
      "saveDetails",
      "delete",
      "confirmDelete",
      "cancel",
    ])
    .safeParse(formData.get("intent"));

  if (intentError) {
    throw new Error(`Invalid form intent (received ${intent})`);
  }

  const { data: fields, error: formError } = z
    .discriminatedUnion("intent", [
      z.object({
        intent: z.literal("create"),
        name: z.string({
          required_error: "This field is required",
          invalid_type_error: "Please provide a valid name",
        }),
        pageCount: z
          .string({
            required_error: "This field is required",
          })
          .transform((field) => Number(field))
          .refine((field) => !Number.isNaN(field) && field > 0, {
            message: "Please provide a valid progress value",
          }),
      }),
      z.object({
        intent: z.literal("saveProgress"),
        id: z.string(),
        progress: z
          .string()
          .transform((field) => Number(field))
          .refine((field) => !Number.isNaN(field) && field > 0, {
            message: "Please provide a valid number",
          }),
      }),
      z.object({
        intent: z.literal("editDetails"),
        id: z.string(),
      }),
      z.object({
        intent: z.literal("saveDetails"),
        id: z.string(),
        name: z.string().optional(),
        pageCount: z
          .string()
          .optional()
          .transform((field) => Number(field))
          .refine((field) => !Number.isNaN(field) && field > 0, {
            message: "Please provide a valid number",
          }),
      }),
      z.object({
        intent: z.literal("delete"),
        id: z.string(),
      }),
      z.object({
        intent: z.literal("confirmDelete"),
        id: z.string(),
      }),
      z.object({
        intent: z.literal("cancel"),
      }),
    ])
    .safeParse(Object.fromEntries(formData));

  if (formError) {
    switch (intent) {
      case "create": {
        return data(
          {
            form: intent,
            ...getFormErrors({
              formError,
              discriminant: {
                name: "intent",
                value: intent,
              },
            }),
          },
          400,
        );
      }

      case "saveDetails": {
        return data(
          {
            form: intent,
            ...getFormErrors({
              formError,
              discriminant: {
                name: "intent",
                value: intent,
              },
            }),
          },
          400,
        );
      }

      default: {
        throw new Error(
          `Error for unhandled form intent "${intent}" + ${formError}`,
        );
      }
    }
  }

  switch (fields.intent) {
    case "create": {
      await database.book.create({
        data: {
          name: fields.name,
          pageCount: fields.pageCount,
          progress: 0,
          userId: session.id,
        },
      });

      break;
    }

    case "saveProgress": {
      await database.book.update({
        where: { id: fields.id },
        data: { progress: fields.progress },
      });

      break;
    }

    case "editDetails": {
      // Switch to second stage where the actual form is shown.
      return data({
        form: "saveDetails" as const,

        // TODO: auto-edit this when adding a new property
        id: fields.id,
        name: null,
        pageCount: null,
      });
    }

    case "saveDetails": {
      if (fields.name) {
        await database.book.update({
          where: {
            id: fields.id,
          },
          data: {
            name: fields.name,
          },
        });
      }

      if (fields.pageCount) {
        await database.book.update({
          where: {
            id: fields.id,
          },
          data: {
            pageCount: fields.pageCount,
          },
        });
      }

      break;
    }

    case "cancel": {
      // Switch to second stage where the actual form is shown.
      return data({
        form: "editDetails" as const,
      });
    }

    case "delete": {
      return data({
        form: "confirmDelete" as const,
      });
    }

    case "confirmDelete": {
      await database.book.delete({
        where: {
          id: fields.id,
        },
      });

      break;
    }

    default:
      throw new Error(`Unhandled form intent "${intent}"`);
  }

  return redirect("/dashboard");
}
