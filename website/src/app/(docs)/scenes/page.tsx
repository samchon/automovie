import type { Metadata } from "next";
import type { ReactElement } from "react";

import ScenesMovie from "../../../movies/ScenesMovie";
import { SCENES } from "../../../scenes/SCENES";
import { SceneStatus } from "../../../scenes/package/SceneStatus";
import type { IScene } from "../../../scenes/structures/IScene";

export const metadata: Metadata = {
  title: "Scenes",
  description:
    "Whole scenes composed from the motion vocabulary, each replayed with other seeds, bodies and skill.",
};

/**
 * The scene gallery's route. Which scenes the installed packages compute is
 * read from their data while the site is exported, so the page knows it
 * before any script runs; the takes themselves are computed in the browser.
 *
 * @returns The page.
 */
export default function ScenesPage(): ReactElement {
  return (
    <ScenesMovie
      computed={SCENES.filter((scene: IScene): boolean =>
        SceneStatus.computes(SceneStatus.of(scene)),
      ).map((scene: IScene): string => scene.id)}
    />
  );
}
