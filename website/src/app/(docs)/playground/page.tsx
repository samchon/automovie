import type { Metadata } from "next";
import type { ReactElement } from "react";

import ForwardMovie from "../../../movies/ForwardMovie";

export const metadata: Metadata = {
  title: "Gallery",
  robots: { index: false },
};

/**
 * Forward saved composition links and the former editor's address.
 *
 * @returns The page.
 */
export default function PlaygroundPage(): ReactElement {
  return <ForwardMovie to="/gallery/" label="Gallery" fragment />;
}
