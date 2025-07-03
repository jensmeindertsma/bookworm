import type { Route } from "./+types/signout";
import { getSession } from "~/services/session.server";
import { redirect } from "react-router";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request);

  if (session.isAuthenticated) {
    return redirect("/dashboard");
  } else {
    return redirect("/");
  }
}

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request);

  if (session.isAuthenticated) {
    return session.destroy({ redirectTo: "/signin" });
  } else {
    return redirect("/signin");
  }
}
