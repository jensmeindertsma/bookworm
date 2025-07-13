import type { Route } from "./+types/signup";
import { database } from "~/services/database.server";
import { convertFormError } from "~/services/form.server";
import { redirectUser } from "~/services/session.server";
import bcrypt from "bcrypt";
import { data, Form } from "react-router";
import z from "zod";

export default function SignUp({
  loaderData,
  actionData: feedback,
}: Route.ComponentProps) {
  const sectionStyle = "flex flex-col mb-5";
  const labelStyle = "mb-1 underline";
  const inputStyle =
    "text-black dark:text-white italic placeholder:text-gray-400 placeholder:italic";
  const errorStyle = "mt-2 underline decoration-red-600";

  return (
    <>
      <Form
        method="post"
        className="flex flex-col border-2 border-black p-8 dark:border-white"
      >
        <input type="hidden" name="token" value={loaderData.token} />

        <div className="mx-auto flex w-80 max-w-full flex-col md:grid md:w-full md:grid-cols-2">
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
              placeholder="John Doe"
            />
            <p className={errorStyle}>{feedback?.name}</p>
          </section>

          <section className={sectionStyle}>
            <label htmlFor="email" className={labelStyle}>
              Email Address
            </label>
            <input
              type="email"
              required
              id="email"
              name="email"
              className={inputStyle}
              placeholder="john.doe@foo.com"
            />
            <p className={errorStyle}>{feedback?.email}</p>
          </section>

          <section className={sectionStyle}>
            <label htmlFor="password" className={labelStyle}>
              Password
            </label>
            <input
              type="password"
              required
              id="password"
              name="password"
              minLength={8}
              className={inputStyle}
              placeholder="secret!123"
            />
            <p className={errorStyle}>{feedback?.password}</p>
          </section>
          <section className={sectionStyle}>
            <label htmlFor="confirmPassword" className={labelStyle}>
              Confirm Password
            </label>
            <input
              type="password"
              required
              id="confirmPassword"
              name="confirmPassword"
              minLength={8}
              className={inputStyle}
              placeholder="same as above"
            />
            <p className={errorStyle}>{feedback?.confirmPassword}</p>
          </section>
        </div>
        <button
          type="submit"
          className="mt-5 w-30 bg-black p-2 text-center text-white dark:bg-white dark:text-black"
        >
          Sign Up
        </button>
      </Form>
    </>
  );
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await redirectUser({ request, redirectTo: "/dashboard" });

  const { token, newHeaders } = await session.getToken();

  if (newHeaders) {
    return data({ token }, { headers: newHeaders });
  } else {
    return data({ token });
  }
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
      name: z.string().min(2, "Must be at least 2 characters long"),
      email: z.string().email("Must be a valid email address long"),
      password: z.string().min(8, "Must be at least 8 characters long"),
      confirmPassword: z.string().min(8, "Must be at least 8 characters long"),
    })
    .refine(({ password, confirmPassword }) => password === confirmPassword, {
      path: ["confirmPassword"],
      message: "Must be the same password",
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
