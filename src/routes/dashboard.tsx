import type { Route } from "./+types/dashboard";
import { Button } from "~/components/button";
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

        <Button>Add new book</Button>
      </Form>

      <ul>
        {loaderData.books.map((book) => (
          <li key={book.id}>
            <hr className="my-8 border-t-2 border-black dark:border-white" />
            <p className="text-xl">{book.name}</p>
            <p>
              (currently on page {book.progress}/{book.pageCount})
            </p>
            <Form method="post" className="flex flex-col">
              <input type="hidden" name="token" value={loaderData.token} />
              <input type="hidden" name="intent" value="saveProgress" />
              <input type="hidden" name="id" value={book.id} />

              <label htmlFor="progress" className={labelStyle}>
                Progress
              </label>
              <input
                type="number"
                required
                id="progress"
                name="progress"
                max={book.pageCount}
                placeholder={book.progress.toString()}
              />

              <Button>Save progress</Button>
            </Form>
            {feedback?.form === "saveDetails" && feedback.id === book.id ? (
              <Form method="post">
                <input type="hidden" name="token" value={loaderData.token} />
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
                    max={5000}
                    className={inputStyle}
                    defaultValue={String(book.pageCount)}
                  />
                  <p className={errorStyle}>
                    {feedback?.form === "saveDetails" && feedback.pageCount}
                  </p>
                </section>

                <Button kind="alternative" name="intent" value="cancel">
                  Cancel
                </Button>
                <Button name="intent" value="saveDetails">
                  Save Details
                </Button>
              </Form>
            ) : (
              <Form method="post">
                <input type="hidden" name="token" value={loaderData.token} />
                <input type="hidden" name="intent" value="editDetails" />
                <input type="hidden" name="id" value={book.id} />

                <Button>Edit Details</Button>
              </Form>
            )}
            {feedback?.form === "confirmDelete" && feedback.id == book.id ? (
              <Form method="post" className="flex flex-row">
                <input type="hidden" name="token" value={loaderData.token} />
                <input type="hidden" name="id" value={book.id} />

                <Button kind="alternative" name="intent" value="cancel">
                  Cancel
                </Button>
                <Button name="intent" value="confirmDelete" className="ml-2">
                  Delete
                </Button>
              </Form>
            ) : (
              <Form method="post">
                <input type="hidden" name="token" value={loaderData.token} />
                <input type="hidden" name="intent" value="delete" />
                <input type="hidden" name="id" value={book.id} />

                <Button>Delete</Button>
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
          error: "This field is required",
        }),
        pageCount: z
          .string({
            error: "This field is required",
          })
          .transform((field) => Number(field))
          .refine((field) => !Number.isNaN(field) && field > 0, {
            error: "Please provide a valid progress value",
          })
          .refine((field) => field <= 5000, {
            error: "Too many pages!",
          }),
      }),
      z.object({
        intent: z.literal("saveProgress"),
        id: z.string(),
        progress: z
          .string()
          .transform((field) => Number(field))
          .refine((field) => !Number.isNaN(field) && field > 0, {
            error: "Please provide a valid number",
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
            error: "Please provide a valid number",
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
      const fetch = await database.book.findUnique({
        where: { id: fields.id },
        select: { pageCount: true },
      });

      if (!fetch) {
        throw new Error("Can't save progress of nonexisting book");
      }

      if (fetch.pageCount < fields.progress) {
        return data(
          {
            form: fields.intent,
            pageCount: "Too high!",
          },
          400,
        );
      }

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
        id: fields.id,
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
