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

        <div className="mx-auto flex w-80 max-w-full flex-col md:grid md:w-full md:grid-cols-2 md:gap-4">
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
