import type { IAutoMovieHumanPersonHeadReading } from "../structures/IAutoMovieHumanPersonHeadReading";
import type { IAutoMovieHumanPersonLandmarkDistanceMeasurement } from "../structures/IAutoMovieHumanPersonLandmarkDistanceMeasurement";
import type { IAutoMovieHumanPersonRestHead } from "../structures/IAutoMovieHumanPersonRestHead";
import { humanPersonHeadPoint } from "./humanPersonHeadPoint";

/**
 * Read the straight distance between two named head view skin points at
 * rest, as a sliding caliper reads it.
 *
 * @evidence contracts/common.md#principled-implementation Both ends are declared points of the head view.
 * @evidence contracts/common.md#clear-and-simple-design Two lookups and one distance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing name refuses.
 * @evidence contracts/common.md#meaningful-documentation States the instrument.
 * @evidence contracts/modeling.md#spatial-conventions A straight distance in metres of the person frame.
 * @evidence contracts/anatomy.md#anatomical-source Follows the protocol the rule cites (ANSUR II 6.4.62 for menton–sellion).
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing; its reading carries the points a render marks.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing; the rule's range is a report.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
 */
export function readHumanPersonLandmarkDistance(
  head: IAutoMovieHumanPersonRestHead,
  rule: IAutoMovieHumanPersonLandmarkDistanceMeasurement,
): IAutoMovieHumanPersonHeadReading {
  const from = humanPersonHeadPoint(head, rule.from);
  const to = humanPersonHeadPoint(head, rule.to);
  return { metres: Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z), points: { [rule.from]: from, [rule.to]: to } };
}
