import type { Metadata } from "next";
import type { ReactElement } from "react";

import ForwardMovie from "../../../movies/ForwardMovie";

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
  return <ForwardMovie to="/archetypes/" label="Archetypes" query />;
}
