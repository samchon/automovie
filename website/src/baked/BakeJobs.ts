import { MotionUsage } from "../motions/MotionUsage";
import { MotionReference } from "../motions/package/MotionReference";
import type { IMotionReference } from "../motions/structures/IMotionReference";
import { SCENES } from "../scenes/SCENES";
import { SceneTake } from "../scenes/SceneTake";
import { SceneStatus } from "../scenes/package/SceneStatus";
import type { IScene } from "../scenes/structures/IScene";
import type { IBakeJob } from "./IBakeJob";

/**
 * What the build computes ahead of the visitor: the first take of every
 * listed scene that plays, and every motion that can be tried alone. A
 * motion tried only inside a scene borrows that scene's take, so it is not a
 * job of its own.
 */
export namespace BakeJobs {
  /**
   * Every job, scenes first, in the order the pages list them.
   *
   * @returns The jobs.
   */
  export function list(): IBakeJob[] {
    const scenes: IBakeJob[] = SCENES.filter(
      (scene: IScene): boolean =>
        scene.hidden !== true &&
        scene.composition !== null &&
        scene.takes.length !== 0 &&
        scene.refusedUntil === undefined &&
        SceneStatus.of(scene).kind === "plays",
    ).map(
      (scene: IScene): IBakeJob => ({
        kind: "scene",
        id: scene.id,
        composition: SceneTake.apply(scene.composition!, scene.takes[0]!),
        view: scene.camera.view,
        from: 0,
      }),
    );
    const reference: IMotionReference = MotionReference.read();
    const motions: IBakeJob[] = [];
    const seen: Set<string> = new Set<string>();
    for (const row of [
      ...reference.actions,
      ...reference.families.flatMap(
        (family: IMotionReference.IFamily): IMotionReference.IRow[] =>
          family.rows,
      ),
    ]) {
      if (seen.has(row.name)) continue;
      seen.add(row.name);
      const trial: MotionUsage.ITrial | null = MotionUsage.trial(row.name);
      if (trial === null || !trial.alone) continue;
      motions.push({
        kind: "motion",
        id: row.name,
        composition: trial.composition,
        view: "three-quarter",
        from: MotionUsage.OPENING,
      });
    }
    return [...scenes, ...motions];
  }
}
