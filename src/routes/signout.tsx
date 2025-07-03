import type { Route } from "./+types/signout";
import { getSession } from "~/services/session.server";
import { redirect } from "react-router";

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request);

  if (session.isAuthenticated) {
    return session.destroy({ redirectTo: "/signin" });
  } else {
    return redirect("/signin");
  }
}
