import { data, useLocation } from "react-router";

export default function NotFound() {
  const { pathname } = useLocation();

  return (
    <div className="border-2 border-black p-8 dark:border-white">
      <h1 className="mb-8 text-xl font-bold">Not Found!</h1>

      <pre>
        {pathname} <span className="font-serif">does not exist.</span>
      </pre>
    </div>
  );
}

export function loader() {
  return data(null, 404);
}
