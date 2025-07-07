import type { Route } from "./+types/signout";
import { getSession } from "~/services/session.server";
import { redirect } from "react-router";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession({ request });

  if (session.isAuthenticated) {
    return redirect("/dashboard");
  } else {
    return redirect("/");
  }
}

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession({ request });

  if (!session.isAuthenticated) {
    return redirect("/signin");
  }

  // Validating the CSRF token is still important here.
  const formData = await request.formData();
  session.verifyToken({ formData });

  return session.destroy({ redirectTo: "/signin" });
}
