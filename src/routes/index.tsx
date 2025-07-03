import type { Route } from "./+types/index";
import { database } from "~/services/database.server";
import { redirectUser } from "~/services/session.server";
import { data } from "react-router";

export default function Index({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <h1>Bookworm</h1>
      <p>Simply track digital reading progress.</p>
      <p>We currently have {loaderData.users} users</p>
    </>
  );
}

export async function loader({ request }: Route.LoaderArgs) {
  await redirectUser({ request, redirectTo: "/dashboard" });

  return data({ users: await database.user.count() }, 400);
}
