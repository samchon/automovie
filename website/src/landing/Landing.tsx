import type { ReactElement } from "react";

import { MotionReference } from "../motions/package/MotionReference";
import type { IMotionReference } from "../motions/structures/IMotionReference";
import LandingMovie from "../movies/LandingMovie";
import { SCENES } from "../scenes/SCENES";
import { readBakedManifest } from "../scenes/readBakedManifest";
import type { IScene } from "../scenes/structures/IScene";
import type { ISceneManifest } from "../scenes/structures/ISceneManifest";

/**
 * The landing page's data, gathered while the site is exported: the
 * featured scenes the bake played with no take refused, in their order; the
 * titles of the listed scenes the bake did not compute, which wait on a
 * release or are planned; and how many actions, families and rows the
 * installed motion package has, so the page states the release it runs. The
 * page is handed these alone, so its script carries no other scene record.
 *
 * @returns The landing page.
 */
export function Landing(): ReactElement {
  const manifest: ISceneManifest | null = readBakedManifest();
  const reference: IMotionReference = MotionReference.read();
  const baked: Record<string, ISceneManifest.IScene> = manifest?.scenes ?? {};
  const plays: (scene: IScene) => boolean = (scene: IScene): boolean =>
    Object.hasOwn(baked, scene.id) &&
    baked[scene.id]!.takes.every(
      (take: ISceneManifest.ITake): boolean => take.refusal === undefined,
    );
  return (
    <LandingMovie
      featured={SCENES.filter(
        (s: IScene): boolean => s.featured !== undefined && plays(s),
      ).sort((a: IScene, b: IScene): number => a.featured! - b.featured!)}
      coming={SCENES.filter(
        (s: IScene): boolean =>
          s.hidden !== true && !Object.hasOwn(baked, s.id),
      ).map((s: IScene): string => s.title)}
      counts={{
        actions: reference.actions.length,
        families: reference.families.length,
        rows: reference.families.reduce(
          (sum: number, f: IMotionReference.IFamily): number =>
            sum + f.rows.length,
          0,
        ),
      }}
    />
  );
}
