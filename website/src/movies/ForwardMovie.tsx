"use client";

import { type ReactElement, useEffect } from "react";

import { SITE_BASE } from "../SITE_BASE";

/**
 * Sends a visitor of a former address to where its content lives now. A static
 * export cannot redirect on the server, so the page replaces its own address,
 * keeping the query or fragment when asked to, and offers the link for a
 * visitor without scripts.
 *
 * @param props The destination under the site's base path, its label and
 *   address parts to keep.
 * @returns The page.
 */
export default function ForwardMovie(props: {
  to: string;
  label: string;
  query?: boolean;
  fragment?: boolean;
}): ReactElement {
  useEffect((): void => {
    window.location.replace(
      `${SITE_BASE}${props.to}${props.query === true ? window.location.search : ""}${props.fragment === true ? window.location.hash : ""}`,
    );
  }, [props.to, props.query, props.fragment]);
  return (
    <main className="am-app">
      <p className="am-status" role="status">
        This page moved to <a href={`${SITE_BASE}${props.to}`}>{props.label}</a>
        .
      </p>
    </main>
  );
}
