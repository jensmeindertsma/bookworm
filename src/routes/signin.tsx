import type { Route } from "./+types/signin";
import { database } from "~/services/database.server";
import { convertFormError } from "~/services/form.server";
import { redirectUser } from "~/services/session.server";
import bcrypt from "bcrypt";
import { data, Form } from "react-router";
import z from "zod";

export default function SignIn({
  loaderData,
  actionData: feedback,
}: Route.ComponentProps) {
  return (
    <>
      <h1>Sign In</h1>
      <Form method="post">
        <input type="hidden" name="token" value={loaderData.token} />

        <label htmlFor="email">Email Address</label>
        <input type="email" required id="email" name="email" />
        {feedback?.email && <p>{feedback.email}</p>}

        <label htmlFor="password">Password</label>
        <input type="password" required id="password" name="password" />
        {feedback?.password && <p>{feedback.password}</p>}

        <button type="submit">Sign In</button>
      </Form>
    </>
  );
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await redirectUser({ request, redirectTo: "/dashboard" });

  const { token, headers } = await session.generateToken();

  return data({ token }, { headers });
}

export async function action({ request }: Route.ActionArgs) {
  const session = await redirectUser({
    request,
    redirectTo: "/dashboard",
  });

  const formData = await request.formData();

  session.verifyToken({ formData });

  const { error, data: fields } = z
    .object({
      email: z.string(),
      password: z.string(),
    })
    .safeParse(Object.fromEntries(formData));

  if (error) {
    return data(convertFormError(error), 400);
  }

  const { email, password } = fields;

  const user = await database.user.findUnique({
    where: { email },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  if (!user) {
    return data(
      { email: "No user with this email address", password: null },
      400,
    );
  }

  const { id, passwordHash } = user;

  const passwordMatched = await bcrypt.compare(password, passwordHash);

  if (!passwordMatched) {
    return data({ email: null, password: "Incorrect password" }, 400);
  }

  return await session.commit({ id, redirectTo: "/" });
}
