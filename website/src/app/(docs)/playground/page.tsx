import type { Metadata } from "next";
import type { ReactElement } from "react";

import PlaygroundMovie from "../../../movies/PlaygroundMovie";

export const metadata: Metadata = {
  title: "Playground",
};

/**
 * The composition playground's route.
 *
 * @returns The page.
 */
export default function PlaygroundPage(): ReactElement {
  return <PlaygroundMovie />;
}
