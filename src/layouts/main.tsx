import type { Route } from "./+types/main";
import { getSession } from "~/services/session.server";
import { data, Form, Link, Outlet } from "react-router";

export default function MainLayout({ loaderData }: Route.ComponentProps) {
  if (loaderData.isAuthenticated) {
    return (
      <>
        <header className="bg-blue-500">
          APP
          <Form method="post" action="/signout">
            <input type="hidden" name="token" value={loaderData.token} />
            <button type="submit">Sign Out</button>
          </Form>
        </header>

        <Outlet />
      </>
    );
  } else {
    return (
      <>
        <header className="mb-10 flex flex-row">
          <Link to="/" className="block h-full py-2 pr-2">
            <span className="font-serif text-2xl font-bold">Bookworm</span>
          </Link>
          <nav className="w-full">
            <ul className="flex h-full flex-row items-center justify-end">
              {[
                ["/signup", "Sign up"],
                ["/signin", "Sign in"],
              ].map(([url, name]) => (
                <li className="ml-4 hover:underline">
                  <Link to={url} className="ml-2 flex h-full rounded-xl p-2">
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>
        <Outlet />
      </>
    );
  }
}

export async function loader({ request }: Route.LoaderArgs) {
  const { isAuthenticated, ...session } = await getSession({ request });

  if (isAuthenticated) {
    const { token, headers } = await session.generateToken();
    return data({ isAuthenticated, token }, { headers });
  }

  return data({ isAuthenticated });
}
