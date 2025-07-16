import type { ReactNode } from "react";

type Options = {
  children: ReactNode;
  className?: string;
  kind?: "alternative";
  name?: string;
  value?: string;
};

export function Button({ children, className, kind, ...options }: Options) {
  const style =
    "mt-2 w-30 bg-black p-2 text-center text-white dark:bg-white dark:text-black " +
    className;

  const alternativeStyle =
    "mt-2 w-30 bg-white p-2 text-center text-white border-2 border-black dark:border-white dark:bg-black dark:text-white " +
    className;

  return (
    <button
      type="submit"
      className={kind === "alternative" ? alternativeStyle : style}
      {...options}
    >
      {children}
    </button>
  );
}
