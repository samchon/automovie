import type { ReactElement } from "react";

/**
 * The page shown for an address the site does not have.
 *
 * @returns The page.
 */
export default function NotFound(): ReactElement {
  return (
    <>
      <h1>Page Not Found</h1>
      <p>The page you requested does not exist.</p>
    </>
  );
}
