import { getEnvironmentVariable } from "./environment.server";
import {
  createCookie,
  createCookieSessionStorage,
  redirect,
} from "react-router";
import z from "zod";

const sessionStorage = createCookieSessionStorage({
  cookie: createCookie("bookworm", {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // one week,
    path: "/",
    sameSite: "lax",
    secrets: [getEnvironmentVariable("SESSION_SECRET")],
  }),
});

type UnauthenticatedSession = {
  isAuthenticated: false;
  commit(options: { id: string; redirectTo: string }): Promise<Response>;
};

type AuthenticatedSession = {
  isAuthenticated: true;
  id: string;
  destroy(options: { redirectTo: string }): Promise<Response>;
};

export async function getSession(
  request: Request,
): Promise<UnauthenticatedSession | AuthenticatedSession> {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie"),
  );

  const validation = z.string().safeParse(session.get("id"));

  if (validation.success) {
    return {
      isAuthenticated: true,

      id: validation.data,

      async destroy({ redirectTo }: { redirectTo: string }) {
        return redirect(redirectTo, {
          headers: {
            "Set-Cookie": await sessionStorage.destroySession(session),
          },
        });
      },
    };
  } else {
    return {
      isAuthenticated: false,

      async commit({ id, redirectTo }: { id: string; redirectTo: string }) {
        session.set("id", id);

        return redirect(redirectTo, {
          headers: {
            "Set-Cookie": await sessionStorage.commitSession(session),
          },
        });
      },
    };
  }
}

type VerifierOptions = {
  request: Request;
  redirectTo: string;
};

export async function redirectUser({ request, redirectTo }: VerifierOptions) {
  {
    const session = await getSession(request);

    if (session.isAuthenticated) {
      throw redirect(redirectTo);
    } else {
      return session;
    }
  }
}

export async function verifySession({ request, redirectTo }: VerifierOptions) {
  {
    const session = await getSession(request);

    if (session.isAuthenticated) {
      return session;
    } else {
      throw redirect(redirectTo);
    }
  }
}
