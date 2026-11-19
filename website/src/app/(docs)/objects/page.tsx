import type { Metadata } from "next";
import type { ReactElement } from "react";

import GalleryRedirect from "../../../movies/GalleryRedirect";

export const metadata: Metadata = {
  title: "Archetypes",
  robots: { index: false },
};

/**
 * The archetypes' former address, which forwards to `/archetypes/` with its
 * query.
 *
 * @returns The page.
 */
export default function ObjectsPage(): ReactElement {
  return <GalleryRedirect />;
}
