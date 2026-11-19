import type { Metadata } from "next";
import type { ReactElement } from "react";

import GalleryRedirect from "../../../movies/GalleryRedirect";

export const metadata: Metadata = {
  title: "Objects",
  robots: { index: false },
};

/**
 * The archetypes' oldest address, which forwards to `/archetypes/` with its
 * query.
 *
 * @returns The page.
 */
export default function GalleryPage(): ReactElement {
  return <GalleryRedirect />;
}
