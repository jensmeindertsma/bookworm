import { data } from "react-router";

export default function NotFound() {
  return <h1>Not Found!</h1>;
}

export function loader() {
  return data(null, 404);
}
