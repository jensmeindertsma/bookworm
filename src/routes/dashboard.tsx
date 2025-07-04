import type { Route } from "./+types/dashboard";
import { database } from "~/services/database.server";
import { getFieldError } from "~/services/form.server";
import { verifySession } from "~/services/session.server";
import { data, Form, redirect } from "react-router";
import z from "zod";

export default function Dashboard({
  loaderData,
  actionData: feedback,
}: Route.ComponentProps) {
  console.log(feedback);

  return (
    <>
      <h1>Dashboard</h1>
      <p>Welcome back, {loaderData.name}</p>
      <hr />
      <ul>
        {loaderData.books.map((book) => (
          <li key={book.id}>
            {book.name} (currently on page {book.progress})
            <Form method="post">
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
          </li>
        ))}
      </ul>
      <Form method="post">
        <input type="hidden" name="kind" value="create" />

        <p>Add a new book</p>
        <label htmlFor="name" />
        <input type="text" required id="name" name="name" />
        {feedback?.kind === "create" && <p>{feedback.name}</p>}

        <button type="submit">Add</button>
      </Form>
    </>
  );
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await verifySession({ request, redirectTo: "/signin" });

  const user = await database.user.findUnique({
    where: { id: session.id },
    select: { books: true, name: true },
  });

  if (!user) {
    throw session.destroy({ redirectTo: "/signin" });
  }

  return data({
    name: user.name,
    books: user.books,
  });
}

export async function action({ request }: Route.ActionArgs) {
  const session = await verifySession({ request, redirectTo: "/signin" });

  const formData = await request.formData();

  console.log(Object.fromEntries(formData));

  const { error: kindError, data: kind } = z
    .enum(["create", "edit"])
    .safeParse(formData.get("kind"));

  if (kindError) {
    throw new Error(`Invalid form kind (received ${kind})`);
  }

  console.log(kind);

  const { data: fields, error: formError } = z
    .discriminatedUnion("kind", [
      z.object({
        kind: z.literal("create"),
        name: z.string({
          required_error: "This field is required",
          invalid_type_error: "Please provide a valid name",
        }),
      }),
      z.object({
        kind: z.literal("edit"),
        progress: z
          .string({
            required_error: "This field is required",
          })
          .transform((field) => Number(field))
          .refine((field) => !Number.isNaN(field), {
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
          { kind, name: getFieldError({ formError, kind, field: "name" }) },
          400,
        );
      }

      case "edit": {
        console.error(formError);
        return data(
          {
            kind,
            progress: getFieldError({ formError, kind, field: "progress" }),
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
