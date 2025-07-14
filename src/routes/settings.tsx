import type { Route } from "./+types/settings";
import { verifySession } from "~/services/session.server";
import { data, Form } from "react-router";

export default function Settings({
  loaderData: { token },
}: Route.ComponentProps) {
  return (
    <>
      <Form method="post">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="kind" value="rename" />

        <button type="submit">Change username</button>
      </Form>
      <Form method="post">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="kind" value="change-email" />

        <button type="submit">Change email address</button>
      </Form>
      <Form method="post">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="kind" value="change-password" />

        <button type="submit">Change password</button>
      </Form>
      <Form method="post">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="kind" value="delete" />

        <button type="submit">Delete account</button>
      </Form>
    </>
  );
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await verifySession({ request, redirectTo: "/signin" });

  const { token, headers } = await session.getToken();

  return data({ token }, { headers });
}
