"use client";

import { type ReactElement, useEffect } from "react";

import { SITE_BASE } from "../SITE_BASE";

/**
 * Sends a visitor of the gallery's old address to its new one with the same
 * query: the objects to `/objects/`, the polygon man to `/human/`. A static
 * export cannot redirect on the server, so the page replaces its own
 * address, and offers the links for a visitor without scripts.
 *
 * @returns The page.
 */
export default function GalleryRedirect(): ReactElement {
  useEffect((): void => {
    const params: URLSearchParams = new URLSearchParams(window.location.search);
    const target: string =
      params.get("subject") === "human"
        ? `${SITE_BASE}/human/`
        : `${SITE_BASE}/objects/${window.location.search}`;
    window.location.replace(target);
  }, []);
  return (
    <main className="am-app">
      <p className="am-status" role="status">
        The gallery moved: the objects are on{" "}
        <a href={`${SITE_BASE}/objects/`}>Objects</a> and the polygon man on{" "}
        <a href={`${SITE_BASE}/human/`}>Human</a>.
      </p>
    </main>
  );
}
