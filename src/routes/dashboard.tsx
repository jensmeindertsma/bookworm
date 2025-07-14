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
  return (
    <>
      <h1>Dashboard</h1>
      <p>Welcome back, {loaderData.name}</p>
      <p>ADD BOOK</p>
      <Form method="post">
        <input type="hidden" name="token" value={loaderData.token} />
        <input type="hidden" name="kind" value="create" />

        <p>Add a new book</p>
        <label htmlFor="name">Name</label>
        <input type="text" required id="name" name="name" />
        {feedback?.kind === "create" && <p>{feedback.name}</p>}

        <label htmlFor="pages">Page Count</label>
        <input type="text" required id="pages" name="pages" />
        {feedback?.kind === "create" && <p>{feedback.pages}</p>}

        <button type="submit">Add</button>
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
