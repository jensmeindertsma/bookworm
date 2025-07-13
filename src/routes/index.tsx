import type { Route } from "./+types/index";
import { database } from "~/services/database.server";
import { redirectUser } from "~/services/session.server";
import { data, Link } from "react-router";

export default function Index({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <p className="mx-auto mt-25 w-50 text-center">
        Simply track your digital reading progres with ease!
      </p>
      <Link
        to="/signup"
        className="mx-auto mt-10 flex w-30 justify-center bg-black px-4 py-2 text-sm font-bold text-white dark:bg-white dark:text-black"
      >
        Get Started
      </Link>
      <p className="mx-auto mt-10 w-50 text-center font-bold">
        {loaderData.users} users are already joyfully reading!
      </p>
    </>
  );
}

export async function loader({ request }: Route.LoaderArgs) {
  await redirectUser({ request, redirectTo: "/dashboard" });

  return data({ users: await database.user.count() }, 400);
}
