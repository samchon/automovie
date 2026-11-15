import type { Metadata } from "next";
import type { ReactElement } from "react";

import GalleryRedirect from "../../../movies/GalleryRedirect";

export const metadata: Metadata = {
  title: "Objects",
  robots: { index: false },
};

/**
 * The gallery's old address. The objects moved to `/objects/`, and the
 * polygon man to `/human/`; a link to this page arrives at the same subject
 * there.
 *
 * @returns The page.
 */
export default function GalleryPage(): ReactElement {
  return <GalleryRedirect />;
}
