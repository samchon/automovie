import type { Metadata } from "next";
import type { ReactElement } from "react";

import ForwardMovie from "../../../movies/ForwardMovie";

export const metadata: Metadata = {
  title: { absolute: "AutoMovie" },
  robots: { index: false },
};

/**
 * A former address the site no longer has a page for, which forwards to the
 * landing page so an old link still arrives somewhere.
 *
 * @returns The page.
 */
export default function HumanPage(): ReactElement {
  return <ForwardMovie to="/" label="the home page" />;
}
