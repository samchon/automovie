import type { ReactElement } from "react";

import { MotionReference } from "../motions/package/MotionReference";
import type { IMotionReference } from "../motions/structures/IMotionReference";
import LandingMovie from "../movies/LandingMovie";
import { readBakedManifest } from "../scenes/readBakedManifest";
import type { ISceneManifest } from "../scenes/structures/ISceneManifest";

/**
 * The landing page's data, gathered while the site is exported: which
 * scenes the bake played, and how many actions, families and rows the
 * installed motion package has, so the page states the release it runs.
 *
 * @returns The landing page.
 */
export function Landing(): ReactElement {
  const manifest: ISceneManifest | null = readBakedManifest();
  const reference: IMotionReference = MotionReference.read();
  return (
    <LandingMovie
      baked={Object.keys(manifest?.scenes ?? {})}
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
