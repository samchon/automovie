import type { IAutoMovieHumanHeadLengthMeasurement } from "./IAutoMovieHumanHeadLengthMeasurement";
import type { IAutoMovieHumanHeadReading } from "./IAutoMovieHumanHeadReading";
import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";
import { findHumanOpisthocranion } from "./findHumanOpisthocranion";
import { humanHeadPoint } from "./humanHeadPoint";

/**
 * Read head length on a head view at rest: the distance from the rule's
 * glabella to the opisthocranion, the farthest midsagittal point at or above
 * the rule's tragion height (`findHumanOpisthocranion`).
 *
 * @evidence contracts/common.md#principled-implementation The far end is the caliper's maximum found on each skin.
 * @evidence contracts/common.md#clear-and-simple-design Two point lookups, one search, one distance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing names and an empty search refuse.
 * @evidence contracts/common.md#meaningful-documentation States the two ends and how the far end is found.
 * @evidence contracts/modeling.md#spatial-conventions A straight distance in metres of the person frame.
 * @evidence contracts/anatomy.md#anatomical-source Follows ANSUR II 6.4.48 as the rule cites it.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing; its reading carries the points a render marks.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing; the rule's range is a report.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
 */
export function readHumanHeadLength(
  head: IAutoMovieHumanHeadSkin,
  rule: IAutoMovieHumanHeadLengthMeasurement,
): IAutoMovieHumanHeadReading {
  const glabella = humanHeadPoint(head, rule.glabella);
  const opisthocranion = findHumanOpisthocranion(
    head,
    glabella,
    humanHeadPoint(head, rule.tragion).y,
  );
  return {
    metres: Math.hypot(
      opisthocranion.x - glabella.x,
      opisthocranion.y - glabella.y,
      opisthocranion.z - glabella.z,
    ),
    points: { glabella, opisthocranion },
  };
}
