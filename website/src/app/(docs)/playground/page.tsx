import type { Metadata } from "next";
import type { ReactElement } from "react";

import PlaygroundMovie from "../../../movies/PlaygroundMovie";

export const metadata: Metadata = {
  title: "Playground",
  description:
    "Compose a performance from @automovie/motions, perform it on the polygon man and read its refusals and verdicts.",
};

/**
 * The composition playground's route.
 *
 * @returns The page.
 */
export default function PlaygroundPage(): ReactElement {
  return <PlaygroundMovie />;
}
