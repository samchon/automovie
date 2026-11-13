import type { Metadata } from "next";
import type { ReactElement } from "react";

import GalleryMovie from "../../../movies/GalleryMovie";

export const metadata: Metadata = {
  title: "Gallery",
};

/**
 * The gallery's route.
 *
 * @returns The page.
 */
export default function GalleryPage(): ReactElement {
  return <GalleryMovie />;
}
