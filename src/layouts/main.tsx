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
        <header className="flex flex-row rounded-2xl bg-cyan-200 p-2">
          <Link to="/" className="rounded-xl bg-white p-2">
            <img src="/caterpillar.png" className="h-10" />
          </Link>
          <nav className="ml-auto">
            <ul className="flex flex-row">
              <li>
                <Link to="/signup" className="block h-15 bg-green-300">
                  Sign Up
                </Link>
              </li>
              <li>
                <Link to="/signin" className="block h-15 bg-green-300">
                  Sign In
                </Link>
              </li>
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
