"use client";

import { type ReactElement, useEffect } from "react";

import { SITE_BASE } from "../SITE_BASE";

/**
 * Sends a visitor of a former address to where its content lives now. A
 * static export cannot redirect on the server, so the page replaces its own
 * address, keeping the query when asked to, and offers the link for a
 * visitor without scripts.
 *
 * @param props Where to go, under the site's base path, what the link says, and whether the query goes along.
 * @returns The page.
 */
export default function ForwardMovie(props: {
  to: string;
  label: string;
  query?: boolean;
}): ReactElement {
  useEffect((): void => {
    window.location.replace(
      `${SITE_BASE}${props.to}${props.query === true ? window.location.search : ""}`,
    );
  }, [props.to, props.query]);
  return (
    <main className="am-app">
      <p className="am-status" role="status">
        This page moved to <a href={`${SITE_BASE}${props.to}`}>{props.label}</a>
        .
      </p>
    </main>
  );
}
