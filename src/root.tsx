import type { Route } from "./+types/root";
import stylesheet from "./app.css?url";
import type { ReactNode } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

export function meta(): Route.MetaDescriptors {
  return [{ title: "Bookworm" }];
}

export function links(): Route.LinkDescriptors {
  return [
    {
      rel: "icon",
      href: "/caterpillar.png",
      type: "image/png",
    },
    { rel: "preload", href: stylesheet, as: "style" },
    { rel: "stylesheet", href: stylesheet },
  ];
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className="bg-white text-black dark:bg-gray-900 dark:text-white"
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="m-4">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) {
    return (
      <>
        <h1>
          {error.status} {error.statusText}
        </h1>
        <p>{error.data}</p>
      </>
    );
  } else if (error instanceof Error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{error.message}</p>
        <p>The stack trace is:</p>
        <pre>{error.stack}</pre>
      </div>
    );
  } else {
    return <h1>Unknown Error</h1>;
  }
}
