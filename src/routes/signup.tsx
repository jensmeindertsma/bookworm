import type { Route } from "./+types/signup";
import { database } from "~/services/database.server";
import { convertFormError } from "~/services/form.server";
import { redirectUser } from "~/services/session.server";
import bcrypt from "bcrypt";
import { data, Form } from "react-router";
import z from "zod";

export default function SignUp({ actionData: feedback }: Route.ComponentProps) {
  return (
    <>
      <h1>Sign Up</h1>
      <Form method="post">
        <label htmlFor="name">Name</label>
        <input type="text" required id="name" name="name" minLength={2} />
        {feedback?.name && <p>{feedback.name}</p>}

        <label htmlFor="email">Email Address</label>
        <input type="email" required id="email" name="email" />
        {feedback?.email && <p>{feedback.email}</p>}

        <label htmlFor="password">Password</label>
        <input
          type="password"
          required
          id="password"
          name="password"
          minLength={8}
        />
        {feedback?.password && <p>{feedback.password}</p>}

        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          type="password"
          required
          id="confirmPassword"
          name="confirmPassword"
          minLength={8}
        />
        {feedback?.confirmPassword && <p>{feedback.confirmPassword}</p>}

        <button type="submit">Sign Up</button>
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

  const validation = z
    .object({
      name: z.string().min(2, "Your name must be at least 2 characters long"),
      email: z.string().email("Please provide a valid email address"),
      password: z
        .string()
        .min(8, "Your password must be at least 8 characters long"),
      confirmPassword: z
        .string()
        .min(8, "Your password must be at least 8 characters long"),
    })
    .refine(({ password, confirmPassword }) => password === confirmPassword, {
      path: ["confirmPassword"],
      message: "Please make sure both passwords are the same",
    })
    .safeParse(Object.fromEntries(formData));

  if (!validation.success) {
    return data(convertFormError(validation.error), 400);
  }

  const { name, email, password } = validation.data;

  const existingUser = await database.user.findUnique({
    where: { email },
    // We don't need to know anything about the user, just that it exists
    select: {
      id: true,
    },
  });

  if (existingUser) {
    return data(
      {
        name: null,
        email: "This email address is already in use",
        password: null,
        confirmPassword: null,
      },
      400,
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const { id } = await database.user.create({
    data: { name, email, passwordHash },
  });

  return session.commit({ id, redirectTo: "/" });
}
