import type { Route } from "./+types/main";
import { getSession } from "~/services/session.server";
import { data, Form, Link, Outlet } from "react-router";

export default function MainLayout({ loaderData }: Route.ComponentProps) {
  if (loaderData.isAuthenticated) {
    console.log("form has token", loaderData.token);
    return (
      <>
        <header className="mb-10 flex flex-row items-baseline">
          <Link to="/" className="block h-full p-2">
            <span className="font-serif text-2xl font-bold">Bookworm</span>
          </Link>
          <Form
            method="post"
            action="/signout"
            className="ml-auto flex flex-row items-baseline justify-end"
          >
            <input type="hidden" name="token" value={loaderData.token} />
            <button type="submit" className="p-2">
              Sign Out
            </button>
          </Form>
        </header>

        <main className="px-2">
          <Outlet />
        </main>
      </>
    );
  } else {
    return (
      <>
        <header className="mb-10 flex flex-row">
          <Link to="/" className="block h-full p-2">
            <span className="font-serif text-2xl font-bold">Bookworm</span>
          </Link>
          <nav className="w-full">
            <ul className="flex h-full flex-row items-center justify-end">
              {[
                ["/signup", "Sign up"],
                ["/signin", "Sign in"],
              ].map(([url, name]) => (
                <li className="ml-4 hover:underline" key={url}>
                  <Link to={url} className="ml-2 flex h-full rounded-xl p-2">
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>
        <main className="px-2">
          <Outlet />
        </main>
      </>
    );
  }
}

export async function loader({ request }: Route.LoaderArgs) {
  const { isAuthenticated, ...session } = await getSession({ request });

  if (isAuthenticated) {
    const { token, newHeaders } = await session.getToken();

    if (newHeaders) {
      return data({ isAuthenticated, token }, { headers: newHeaders });
    } else {
      return data({ isAuthenticated, token });
    }
  }

  return data({ isAuthenticated });
}
