import type { Metadata } from "next";
import type { ReactElement } from "react";

import ScenesMovie from "../../../movies/ScenesMovie";
import { readBakedManifest } from "../../../scenes/readBakedManifest";
import type { ISceneManifest } from "../../../scenes/structures/ISceneManifest";

export const metadata: Metadata = {
  title: "Scenes",
  description:
    "Whole scenes composed from the motion vocabulary, each replayed with other seeds, bodies and skill.",
};

/**
 * The scene gallery's route. Which scenes play is read from the bake while
 * the site is exported, so the page knows it before any script runs.
 *
 * @returns The page.
 */
export default function ScenesPage(): ReactElement {
  const manifest: ISceneManifest | null = readBakedManifest();
  return (
    <ScenesMovie
      baked={Object.keys(manifest?.scenes ?? {})}
    />
  );
}
