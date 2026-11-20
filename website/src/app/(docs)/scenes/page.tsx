import type { Metadata } from "next";
import type { ReactElement } from "react";

import { BakedManifest } from "../../../baked/BakedManifest";
import ScenesMovie from "../../../movies/ScenesMovie";
import { SCENES } from "../../../scenes/SCENES";
import { SceneStatus } from "../../../scenes/package/SceneStatus";
import type { IScene } from "../../../scenes/structures/IScene";

export const metadata: Metadata = {
  title: "Scene studies",
  description:
    "Whole performances composed from the motion vocabulary and the archetypes, each with its takes, its timeline and its code.",
};

/**
 * The scene gallery's route. Which scenes play, and which were baked, is
 * read while the site is exported, so the page lists them before any script
 * runs. A scene its record marks refused is left with the scenes in the
 * works, since its card would show a refusal instead of a performance.
 *
 * @returns The page.
 */
export default function ScenesPage(): ReactElement {
  return (
    <ScenesMovie
      playing={SCENES.filter(
        (scene: IScene): boolean =>
          scene.refusedUntil === undefined &&
          SceneStatus.of(scene).kind === "plays",
      ).map((scene: IScene): string => scene.id)}
      baked={Object.keys(BakedManifest.read().scenes)}
    />
  );
}
