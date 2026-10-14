import type { IHumanFaceHairStationStep } from "./IHumanFaceHairStationStep";
import type { createHumanFaceHairExteriorInterval } from "./createHumanFaceHairExteriorInterval";

/**
 * The admitted chord of one rooted-stem station and the exterior interval that certified it, returned by `stepHumanFaceHairRootedStem`.
 *
 * The walk appends the step's point and, through the interval, reads whether the stem has reached full free clearance.
 *
 * @evidence contracts/common.md#principled-implementation The admitted next chord is paired with the exterior interval that bounded and certified its travel.
 * @evidence contracts/common.md#clear-and-simple-design stepHumanFaceHairRootedStem returns both facts so the walk can append progress and detect free clearance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An interval certifies its numerical collider premises, not a rendered strand or clinical hair property.
 * @evidence contracts/common.md#meaningful-documentation taken holds point and measured travel while interval retains the same-collider exterior result.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Interval search and progress admission occur in the step owner, not this result schema.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The walk reuses the returned interval instead of independently certifying the same chord.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the returned outcome and its point; reader lifetime remains with the existing walk context.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRootedStemOutcome {
  /** The admitted chord. */
  taken: IHumanFaceHairStationStep;

  /** The exterior interval that certified it. */
  interval: ReturnType<typeof createHumanFaceHairExteriorInterval>;
}
