import type { ReactElement } from "react";

import { SITE_BASE } from "../SITE_BASE";

/**
 * The page shown for an address the site does not have, with the places a
 * visitor most likely meant.
 *
 * @returns The page.
 */
export default function NotFound(): ReactElement {
  return (
    <main className="am-missing">
      <img
        src={`${SITE_BASE}/favicon.svg`}
        width={40}
        height={40}
        alt=""
        aria-hidden="true"
      />
      <h1>No page here.</h1>
      <p>The address may have moved when the site was rebuilt.</p>
      <nav aria-label="Where to go">
        <a className="am-button am-button-primary" href={`${SITE_BASE}/`}>
          Home
        </a>
        <a className="am-button" href={`${SITE_BASE}/docs/`}>
          Docs
        </a>
        <a className="am-button" href={`${SITE_BASE}/reference/`}>
          Reference
        </a>
        <a className="am-button" href={`${SITE_BASE}/gallery/`}>
          Gallery
        </a>
      </nav>
    </main>
  );
}
