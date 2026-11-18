import type { ReactElement } from "react";

import { MotionReference } from "../motions/package/MotionReference";
import type { IMotionReference } from "../motions/structures/IMotionReference";
import LandingMovie from "../movies/LandingMovie";
import { SCENES } from "../scenes/SCENES";
import { SceneStatus } from "../scenes/package/SceneStatus";
import type { IScene } from "../scenes/structures/IScene";

/**
 * The landing page's data, gathered while the site is exported: the
 * featured scenes that play, with no refusal marked on their records, in
 * their order; the titles of the listed scenes the installed packages cannot
 * compute, which wait on a release or are planned; and how many actions,
 * families and rows the installed motion package has, so the page states the
 * release it runs. The page is handed these alone, so its script carries no
 * other scene record.
 *
 * @returns The landing page.
 */
export function Landing(): ReactElement {
  const reference: IMotionReference = MotionReference.read();
  return (
    <LandingMovie
      featured={SCENES.filter(
        (s: IScene): boolean =>
          s.featured !== undefined &&
          s.hidden !== true &&
          s.takes.length > 0 &&
          SceneStatus.of(s).kind === "plays",
      ).sort((a: IScene, b: IScene): number => a.featured! - b.featured!)}
      coming={SCENES.filter(
        (s: IScene): boolean =>
          s.hidden !== true && !SceneStatus.computes(SceneStatus.of(s)),
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
