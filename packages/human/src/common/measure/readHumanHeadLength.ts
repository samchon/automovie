import type { IAutoMovieHumanHeadLengthMeasurement } from "./IAutoMovieHumanHeadLengthMeasurement";
import type { IAutoMovieHumanHeadReading } from "./IAutoMovieHumanHeadReading";
import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";
import { findHumanOpisthocranion } from "./findHumanOpisthocranion";
import { humanHeadPoint } from "./humanHeadPoint";

/**
 * Read head length on a head view at rest: the distance from the rule's
 * glabella to the opisthocranion, the farthest midsagittal point at or above
 * the rule's tragion height (`findHumanOpisthocranion`).
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
