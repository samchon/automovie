"use client";

import { type ReactElement, useEffect } from "react";

import { SITE_BASE } from "../SITE_BASE";

/**
 * Sends a visitor of an old address of the archetypes, `/gallery/` or
 * `/objects/`, to `/archetypes/` with the same query, which names the same
 * archetype there. A static export cannot redirect on the server, so the
 * page replaces its own address, and offers the link for a visitor without
 * scripts.
 *
 * @returns The page.
 */
export default function GalleryRedirect(): ReactElement {
  useEffect((): void => {
    window.location.replace(
      `${SITE_BASE}/archetypes/${window.location.search}`,
    );
  }, []);
  return (
    <main className="am-app">
      <p className="am-status" role="status">
        The archetypes moved to{" "}
        <a href={`${SITE_BASE}/archetypes/`}>Archetypes</a>.
      </p>
    </main>
  );
}
