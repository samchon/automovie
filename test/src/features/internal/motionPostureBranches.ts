import type { IAutoMovieMotionHumanBase, IAutoMovieMotionHumanPerformance } from "@automovie/interface";

import type { motionHumanBody } from "./motionHumanBody";
import type { motionHumanLaw } from "./motionHumanLaw";
import { MOTION_HUMAN_LAW_STAGES_POSTURE } from "./MOTION_HUMAN_LAW_STAGES_POSTURE";
import { motionHumanLawSweep } from "./motionHumanLawSweep";

/**
 * Collect the original audit findings for the distinct branches a posture test owns.
 * Each stage is solo. A default branch also repeats from an independently staged
 * input to check deterministic positions and orientations.
 *
 * @param branches The staged inputs selected by this test.
 * @param observe Optional geometry checks against the same first film.
 * @returns The sweep findings, including a failed stage or observation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is performed, what is compared, and which branch is independently repeated.
 * @evidence contracts/development/implementation.md#principled-implementation Each selected branch uses the existing solo fixture and real-film audit. Default rows also keep the independent display repeat.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch traversal delegates film construction and measurement to the same cell owner as the full law sweep.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts All findings keep their law, row, body, measure and bound; no detector or tolerance is changed.
 * @evidence contracts/development/implementation.md#efficient-algorithms Performs one film per distinct input branch and an independent repeat only at each selected default. A solo stage borrows the same body for its unused partner argument.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Every detector shares the one actual staged film and its displayed frames.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns complaint text only. Films and their frame records are local to a cell.
 */
export function motionPostureBranches(
  branches: readonly motionPostureBranches.Branch[],
  observe?: motionPostureBranches.Observe,
): string[] {
  return branches.flatMap((branch: motionPostureBranches.Branch): string[] => {
    const [law, row, body] = branch;
    return motionHumanLawSweep.cell(
      law,
      row,
      MOTION_HUMAN_LAW_STAGES_POSTURE[law]!,
      [body, body],
      motionHumanLawSweep.SEEDS[0]!,
      observe === undefined ? undefined : (film: motionHumanLaw.IFilm): void => observe(film, branch),
      row === "default",
    ).complaints;
  });
}

/**
 * A distinct input branch and the actual rig that performs it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies one law, one input row and one performer body.
 * @evidence contracts/development/design.md#principled-representation A case is the stage identity, requested setting and real-body identity, without any expected result or audit override.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This tuple carries the three facts its solo stage needs.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts There is no fixture-specific expected finding or waiver.
 */
export namespace motionPostureBranches {
  /** Stage name, input row and solo performer body. */
  export type Branch = readonly [law: string, row: string, body: motionHumanBody.Name];

  /** Read the tested branch's exact audited film. */
  export type Observe = (film: motionHumanLaw.IFilm, branch: Branch) => void;

  /** Check the grammar base declared by the tested action's existing plan. */
  export function checkBase(
    findings: string[],
    performance: IAutoMovieMotionHumanPerformance,
    label: string,
    expected: IAutoMovieMotionHumanBase.Kind,
  ): void {
    const actual: IAutoMovieMotionHumanBase | undefined = performance.segments("a")[0]!.plan.base;
    if (actual === undefined)
      findings.push(`${label}: no base declared, ${expected} expected`);
    else if (actual.kind !== expected)
      findings.push(`${label}: ends ${actual.kind}, ${expected} expected`);
  }
}
