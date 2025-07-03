import type { Route } from "./+types/dashboard";
import { database } from "~/services/database.server";
import { verifySession } from "~/services/session.server";
import { data } from "react-router";

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <h1>Dashboard</h1>
      <p>Welcome back, {loaderData.name}</p>
    </>
  );
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await verifySession({ request, redirectTo: "/signin" });

  const user = await database.user.findUnique({
    where: { id: session.id },
    select: { books: true, name: true },
  });

  if (!user) {
    throw session.destroy({ redirectTo: "/signin" });
  }

  return data({
    name: user.name,
    books: user.books,
  });
}
