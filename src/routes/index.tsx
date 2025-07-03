import type { Route } from "./+types/index";
import { database } from "~/services/database.server";

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <h1>Bookworm</h1>
      There are {loaderData.books.length} books in the library!
    </>
  );
}

export async function loader() {
  return { books: await database.book.findMany() };
}
