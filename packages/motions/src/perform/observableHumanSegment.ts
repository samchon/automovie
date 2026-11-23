import type { IAutoMovieMotionHumanSegment } from "@automovie/interface";

/**
 * Whether a displayed second of an action can be evaluated for some bones
 * alone: no held prop, no stopped weapon and no entering offset still
 * decaying, each of which reads the whole pose.
 *
 * @param person The person.
 * @param segment The action shown.
 * @param seconds Film seconds.
 * @returns Whether a bone observation is honoured there.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three stages that read the whole pose.
 * @evidence contracts/development/implementation.md#principled-implementation A carry, a stop and an inertialization offset each fit or blend from the complete pose, so only their absence lets a demand stand.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One conjunction, shared by the displayed evaluator (`HumanSegmentPose.seeded`) and the kept-pose reader (`HumanSegmentShown.of`).
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The evaluator's original gate, unchanged.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure test.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function observableHumanSegment(
  person: IAutoMovieMotionHumanSegment.IPerson,
  segment: IAutoMovieMotionHumanSegment,
  seconds: number,
): boolean {
  const transition: IAutoMovieMotionHumanSegment["transition"] =
    segment.transition;
  return (
    person.holds.length === 0 &&
    person.stops.size === 0 &&
    !(
      transition !== undefined &&
      transition.kind !== "redirect" &&
      seconds - transition.cut < transition.blend
    )
  );
}
