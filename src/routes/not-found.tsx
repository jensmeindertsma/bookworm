import { data, useLocation } from "react-router";

export default function NotFound() {
  const { pathname } = useLocation();

  return (
    <h1>
      Not Found! <pre>{pathname}</pre> does not exist
    </h1>
  );
}

export function loader() {
  return data(null, 404);
}
