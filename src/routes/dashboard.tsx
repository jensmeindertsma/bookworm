import type { Route } from "./+types/dashboard";
import { database } from "~/services/database.server";
import { getFormErrors } from "~/services/form.server";
import { verifySession } from "~/services/session.server";
import { data, Form, redirect } from "react-router";
import z from "zod";

export default function Dashboard({
  loaderData,
  actionData: feedback,
}: Route.ComponentProps) {
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

      <hr className="my-8 border-t-2 border-white" />

      <Form method="post">
        <input type="hidden" name="token" value={loaderData.token} />
        <input type="hidden" name="kind" value="create" />

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
            {feedback?.kind === "create" && feedback.name}
          </p>
        </section>

        <section className={sectionStyle}>
          <label htmlFor="pages" className={labelStyle}>
            Pages
          </label>
          <input
            type="number"
            required
            id="pages"
            name="pages"
            className={inputStyle}
            placeholder="123"
          />
          <p className={errorStyle}>
            {feedback?.kind === "create" && feedback.name}
          </p>
        </section>

        <button type="submit" className={buttonStyle}>
          Add new book
        </button>
      </Form>

      <ul>
        {loaderData.books.map((book) => (
          <li key={book.id}>
            <p>
              {book.name} (currently on page {book.progress})
            </p>
            <p>EDIT BOOK</p>
            <Form method="post">
              <input type="hidden" name="token" value={loaderData.token} />
              <input type="hidden" name="kind" value="edit" />

              <input type="hidden" name="id" value={book.id} />

              <label htmlFor="progress">Edit Progress</label>
              <input
                type="number"
                required
                id="progress"
                name="progress"
                placeholder={book.progress.toString()}
              />
              {feedback?.kind === "edit" && <p>{feedback.progress}</p>}

              <button type="submit">Save progress</button>
            </Form>
            <p>DELETE BOOK</p>
            <Form method="post">
              <input type="hidden" name="token" value={loaderData.token} />
              <input type="hidden" name="kind" value="delete" />

              <button type="submit">Delete Book</button>
            </Form>
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

  const { error: kindError, data: kind } = z
    .enum(["create", "edit"])
    .safeParse(formData.get("kind"));

  if (kindError) {
    throw new Error(`Invalid form kind (received ${kind})`);
  }

  const { data: fields, error: formError } = z
    .discriminatedUnion("kind", [
      z.object({
        kind: z.literal("create"),
        name: z.string({
          required_error: "This field is required",
          invalid_type_error: "Please provide a valid name",
        }),
        pages: z
          .string({
            required_error: "This field is required",
          })
          .transform((field) => Number(field))
          .refine((field) => !Number.isNaN(field) && field > 0, {
            message: "Please provide a valid progress value",
          }),
      }),
      z.object({
        kind: z.literal("edit"),
        progress: z
          .string({
            required_error: "This field is required",
          })
          .transform((field) => Number(field))
          .refine((field) => !Number.isNaN(field) && field > 0, {
            message: "Please provide a valid progress value",
          }),
        id: z.string(),
      }),
    ])
    .safeParse(Object.fromEntries(formData));

  if (formError) {
    switch (kind) {
      case "create": {
        return data(
          {
            kind,
            ...getFormErrors({
              formError,
              discriminant: {
                name: "kind",
                value: kind,
              },
            }),
          },
          400,
        );
      }
    }

    switch (kind) {
      case "edit": {
        return data(
          {
            kind,
            ...getFormErrors({
              formError,
              discriminant: {
                name: "kind",
                value: kind,
              },
            }),
          },
          400,
        );
      }
    }
  }

  switch (fields.kind) {
    case "create": {
      await database.book.create({
        data: {
          name: fields.name,
          pages: fields.pages,
          progress: 0,
          userId: session.id,
        },
      });

      break;
    }

    case "edit": {
      await database.book.update({
        where: {
          id: fields.id,
        },
        data: {
          progress: fields.progress,
        },
      });

      break;
    }
  }

  return redirect("/dashboard");
}
