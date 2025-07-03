import {
  index,
  layout,
  route,
  type RouteConfig,
} from "@react-router/dev/routes";

export default [
  layout("layouts/main.tsx", [
    layout("layouts/error.tsx", [
      index("routes/index.tsx"),

      route("signup", "routes/signup.tsx"),
      route("signin", "routes/signin.tsx"),
      route("signout", "routes/signout.tsx"),

      route("dashboard", "routes/dashboard.tsx"),

      route("*", "routes/not-found.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
