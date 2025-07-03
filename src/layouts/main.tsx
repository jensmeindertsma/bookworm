import type { Route } from "./+types/main";
import { getSession } from "~/services/session.server";
import { Form, Link, Outlet } from "react-router";

export default function MainLayout({ loaderData }: Route.ComponentProps) {
  if (loaderData.isAuthenticated) {
    return (
      <>
        <header>
          APP
          <Form method="post" action="/signout">
            <button type="submit">Sign Out</button>
          </Form>
        </header>

        <Outlet />
      </>
    );
  } else {
    return (
      <>
        <header>
          <Link to="/">Bookworm</Link>
          <nav>
            <ul>
              <li>
                <Link to="/signup">Sign Up</Link>
              </li>
              <li>
                <Link to="/signin">Sign In</Link>
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
  const { isAuthenticated } = await getSession(request);

  return { isAuthenticated };
}
