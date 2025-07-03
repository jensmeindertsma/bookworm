import { getEnvironmentVariable } from "./environment.server";
import {
  createCookie,
  createCookieSessionStorage,
  redirect,
  type Session,
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

function createInterface(session: Session) {
  return {
    id(): string | null {
      const validation = z.string().safeParse(session.get("id"));

      if (validation.success) {
        return validation.data;
      } else {
        return null;
      }
    },

    async commit({ id, redirectTo }: { id: string; redirectTo: string }) {
      session.set("id", id);

      return redirect(redirectTo, {
        headers: {
          "Set-Cookie": await sessionStorage.commitSession(session),
        },
      });
    },

    async destroy({ redirectTo }: { redirectTo: string }) {
      return redirect(redirectTo, {
        headers: {
          "Set-Cookie": await sessionStorage.destroySession(session),
        },
      });
    },
  };
}

export async function getSession(request: Request) {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie"),
  );

  return createInterface(session);
}

export async function verifySession({
  request,
  redirectTo,
}: {
  request: Request;
  redirectTo: string;
}) {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie"),
  );

  const validation = z.string().safeParse(session.get("id"));

  if (!validation.success) {
    throw redirect(redirectTo);
  }

  const { destroy } = createInterface(session);

  return {
    id: validation.data,
    destroy,
  };
}

export async function redirectUser({
  request,
  redirectTo,
}: {
  request: Request;
  redirectTo: string;
}) {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie"),
  );

  const validation = z.string().safeParse(session.get("id"));

  if (validation.success) {
    throw redirect(redirectTo);
  }

  const { commit } = createInterface(session);

  return {
    commit,
  };
}
