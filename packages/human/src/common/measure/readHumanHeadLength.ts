import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanHeadLengthMeasurement } from "./IAutoMovieHumanHeadLengthMeasurement";
import type { IAutoMovieHumanHeadReading } from "./IAutoMovieHumanHeadReading";
import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";
import { findHumanOpisthocranion } from "./findHumanOpisthocranion";
import { humanHeadPoint } from "./humanHeadPoint";

/**
 * Read head length on a head view at rest: the distance from the rule's
 * glabella to the opisthocranion, the farthest admitted midsagittal edge crossing at or above
 * the rule's tragion height (`findHumanOpisthocranion`).
 *
 * @evidence contracts/common.md#principled-implementation Named glabella and tragion height configure the farthest admitted midsagittal crossing, and their Euclidean distance gives rest-head length. The floor/rest frame remain the shared instrument's declared approximations.
 * @evidence contracts/common.md#clear-and-simple-design Landmark lookup and opisthocranion search retain their canonical owners; this wrapper owns length and marker packaging.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source-sample maximum or expected cranial length replaces the actual section point, and missing source/search results keep their named refusal.
 * @evidence contracts/common.md#meaningful-documentation The public comment names the endpoints, midsagittal maximum and tragion bound; the result type gives metre units and actual contact markers.
 * @evidence contracts/performance.md#efficient-algorithms Two point lookups and the shared O(T) extremum scan dominate, followed by constant distance work and fixed output storage.
 * @evidence contracts/performance.md#reuse-equivalent-work The one computed opisthocranion supplies both distance and marker output, without repeating its section scan or caching mutable head readings.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrowed head inputs remain caller-owned, and two fresh markers plus the scalar transfer without retained mesh handles or background work.
 */
export function readHumanHeadLength(
  head: IAutoMovieHumanHeadSkin,
  rule: IAutoMovieHumanHeadLengthMeasurement,
): IAutoMovieHumanHeadReading {
  const glabella: IAutoMovieVector3 = humanHeadPoint(head, rule.glabella);
  const opisthocranion: IAutoMovieVector3 = findHumanOpisthocranion(
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
