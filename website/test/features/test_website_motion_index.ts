import { TestValidator } from "@nestia/e2e";

import { BakeJobs } from "../../src/baked/BakeJobs";
import type { IBakeJob } from "../../src/baked/IBakeJob";
import type { IPlaygroundComposition } from "../../src/playground/structures/IPlaygroundComposition";
import { MotionUsage } from "../../src/motions/MotionUsage";
import { MotionIndex } from "../../src/motions/package/MotionIndex";
import { MotionReference } from "../../src/motions/package/MotionReference";
import type { IMotionReference } from "../../src/motions/structures/IMotionReference";
import { SCENES } from "../../src/scenes/SCENES";
import { SceneStatus } from "../../src/scenes/package/SceneStatus";
import type { IScene } from "../../src/scenes/structures/IScene";

/**
 * The motion catalogue lists the installed vocabulary once, and the bake
 * covers what the pages play.
 *
 * Scenarios:
 * 1. Every action and row of the installed reference is in the catalogue exactly once, the total counts them, and every family the reference has is in some category.
 * 2. Each motion's page names its family's neighbours: the previous motion's next is the motion, and the first and last of a family have none.
 * 3. The bake's scene jobs are exactly the listed scenes that play and carry no refusal, each performing its first take.
 * 4. The bake's motion jobs are the motions tried alone, each standing for the opening second before its motion.
 */
export function test_website_motion_index(): void {
  const reference: IMotionReference = MotionReference.read();
  const index: MotionIndex.IIndex = MotionIndex.index();
  const listed: string[] = index.categories.flatMap((c: MotionIndex.ICategory): string[] =>
    c.families.flatMap((f: MotionIndex.IFamily): string[] =>
      f.motions.map((m: MotionIndex.IEntry): string => m.name),
    ),
  );
  const names: Set<string> = new Set([
    ...reference.actions.map((a: IMotionReference.IRow): string => a.name),
    ...reference.families.flatMap((f: IMotionReference.IFamily): string[] =>
      f.rows.map((r: IMotionReference.IRow): string => r.name),
    ),
  ]);

  // 1. Every motion once.
  TestValidator.equals("no motion twice", listed.length, new Set(listed).size);
  TestValidator.equals("every motion", [...listed].sort(), [...names].sort());
  TestValidator.equals("the total", index.total, names.size);
  TestValidator.predicate(
    "every family placed",
    reference.families.every((f: IMotionReference.IFamily): boolean =>
      index.categories.some((c: MotionIndex.ICategory): boolean =>
        c.families.some((g: MotionIndex.IFamily): boolean => g.name === f.name),
      ),
    ),
  );

  // 2. Neighbours agree.
  for (const category of index.categories)
    for (const family of category.families)
      family.motions.forEach((entry: MotionIndex.IEntry, i: number): void => {
        const detail: MotionIndex.IDetail = MotionIndex.detail(entry.name);
        TestValidator.equals(`${entry.name}'s neighbours`, [detail.previous, detail.next], [
          family.motions[i - 1]?.name ?? null,
          family.motions[i + 1]?.name ?? null,
        ]);
      });

  // 3. The scene jobs.
  const jobs: IBakeJob[] = BakeJobs.list();
  TestValidator.equals(
    "a job per playing scene",
    jobs.filter((j: IBakeJob): boolean => j.kind === "scene").map((j: IBakeJob): string => j.id),
    SCENES.filter(
      (s: IScene): boolean =>
        s.hidden !== true &&
        s.composition !== null &&
        s.takes.length !== 0 &&
        s.refusedUntil === undefined &&
        SceneStatus.of(s).kind === "plays",
    ).map((s: IScene): string => s.id),
  );

  // 4. The motion jobs.
  const motions: IBakeJob[] = jobs.filter((j: IBakeJob): boolean => j.kind === "motion");
  TestValidator.predicate("some motions are tried alone", motions.length > 0);
  TestValidator.predicate(
    "each opens with its stand, then performs its motion",
    motions.every(
      (j: IBakeJob): boolean =>
        j.from === MotionUsage.OPENING &&
        j.composition.performers.length === 1 &&
        j.composition.performers[0]!.actions.map((a: IPlaygroundComposition.IAction): string => a.name).join(" ") ===
          `stand ${j.id}`,
    ),
  );
}
