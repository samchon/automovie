import type { IAutoMovieMotionHumanSegment } from "@automovie/interface";

/*
 * Whether a displayed second of an action can be evaluated for some bones
 * alone: no held prop, no stopped weapon and no entering offset still decaying,
 * each of which reads the whole pose.
 * Parameter person: The person.
 * Parameter segment: The action shown.
 * Parameter seconds: Film seconds.
 * Returns: Whether a bone observation is honoured there.
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
