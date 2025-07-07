import { getEnvironmentVariable } from "./environment.server";
import { randomUUID } from "node:crypto";
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

type TokenInterface = {
  generateToken(): Promise<{ token: string; headers: Headers }>;
  verifyToken(options: { formData: FormData }): void;
};

type UnauthenticatedSession = {
  isAuthenticated: false;
  commit(options: { id: string; redirectTo: string }): Promise<Response>;
} & TokenInterface;

type AuthenticatedSession = {
  isAuthenticated: true;
  id: string;
  destroy(options: { redirectTo: string }): Promise<Response>;
} & TokenInterface;

type Options = {
  request: Request;
  checkToken?: boolean;
};

export async function getSession({
  request,
}: Options): Promise<UnauthenticatedSession | AuthenticatedSession> {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie"),
  );

  const tokenInterface = createTokenInterface(session);

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

      ...tokenInterface,
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

      ...tokenInterface,
    };
  }
}

function createTokenInterface(session: Session): TokenInterface {
  return {
    async generateToken() {
      const token = randomUUID();
      const headers = new Headers();

      session.set("token", token);
      headers.set("Set-Cookie", await sessionStorage.commitSession(session));

      return { token, headers };
    },

    verifyToken({ formData }) {
      const sessionToken = session.get("token");

      if (!sessionToken || typeof sessionToken !== "string") {
        throw new Response("Missing CSRF session token!", { status: 400 });
      }

      const formToken = formData.get("token");

      if (!formToken || typeof formToken !== "string") {
        throw new Response("Missing CSRF form token!", { status: 400 });
      }

      if (sessionToken !== formToken) {
        throw new Response("CSRF tokens did not match!", { status: 403 });
      }
    },
  };
}

type VerifierOptions = {
  request: Request;
  redirectTo: string;
};

export async function redirectUser({ request, redirectTo }: VerifierOptions) {
  {
    const session = await getSession({ request });

    if (session.isAuthenticated) {
      throw redirect(redirectTo);
    } else {
      return session;
    }
  }
}

export async function verifySession({ request, redirectTo }: VerifierOptions) {
  {
    const session = await getSession({ request });

    if (session.isAuthenticated) {
      return session;
    } else {
      throw redirect(redirectTo);
    }
  }
}
