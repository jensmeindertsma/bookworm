import type { Route } from "./+types/main";
import { getSession } from "~/services/session.server";
import { data, Form, Link, Outlet } from "react-router";

export default function MainLayout({ loaderData }: Route.ComponentProps) {
  if (loaderData.isAuthenticated) {
    return (
      <>
        <header className="mb-10 flex flex-col md:flex-row">
          <Link to="/" className="block h-full p-2">
            <span className="font-serif text-2xl font-bold">Bookworm</span>
          </Link>

          <div className="flex flex-row md:ml-auto">
            <nav className="md:w-full">
              <ul className="flex h-full flex-row items-center justify-end">
                {[["/dashboard", "Dashboard"]].map(([url, name]) => (
                  <li
                    className="mr-4 hover:underline md:mr-0 md:ml-4"
                    key={url}
                  >
                    <Link to={url} className="flex h-full rounded-xl p-2">
                      {name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <Form
              method="post"
              action="/signout"
              className="inline-flex flex-row items-center justify-end"
            >
              <input type="hidden" name="token" value={loaderData.token} />
              <button
                type="submit"
                className="p-2 whitespace-nowrap hover:underline"
              >
                Sign out
              </button>
            </Form>
          </div>
        </header>

        <main className="px-2 pb-16">
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
                  <Link to={url} className="flex h-full rounded-xl p-2">
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
  const session = await getSession({ request });

  if (session.isAuthenticated) {
    const { token, headers } = await session.getToken();

    return data({ isAuthenticated: true as const, token }, { headers });
  } else {
    return data({ isAuthenticated: false as const });
  }
}
