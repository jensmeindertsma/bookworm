import {
  index,
  layout,
  route,
  type RouteConfig,
} from "@react-router/dev/routes";

export default [
  // We use one global layout for both the "front" and "app" part of
  // the application. This is because we want to render 404's and errors
  // *inside* the layout, either the unauthenticated "front" layout or the
  // authenticated "app" layout. We can add a catchall route (`*`) to display
  // 404's, but we could not add two catchall routes both under the /
  // prefix, one for "front" and one for "app". React Router would not
  // know which catchall to render. Thus we have one global layout "main"
  // that renders the correct layout based on authentication status.
  layout("layouts/main.tsx", [
    // Inside the "main" layout we have the "error" layout which is a
    // transparent route that just renders `<Outlet />`. It's job is to
    // handle errors with an ErrorBoundary that will render *inside* the
    // main layout. If we'd add the ErrorBoundary in `main.tsx`, the layout
    // would dissapear when React Router switches to the ErrorBoundary (where
    // loader data and thus authentication status are unavailable).
    layout("layouts/error.tsx", [
      index("routes/index.tsx"),

      route("signup", "routes/signup.tsx"),
      route("signin", "routes/signin.tsx"),
      route("signout", "routes/signout.tsx"),

      route("dashboard", "routes/dashboard.tsx"),
      route("settings", "routes/settings.tsx"),

      route("*", "routes/not-found.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
