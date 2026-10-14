import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanHeadReading } from "./IAutoMovieHumanHeadReading";
import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";
import type { IAutoMovieHumanLandmarkDistanceMeasurement } from "./IAutoMovieHumanLandmarkDistanceMeasurement";
import { humanHeadPoint } from "./humanHeadPoint";

/**
 * Read the straight distance between two named head view skin points at
 * rest, as a sliding caliper reads it.
 *
 * @evidence contracts/common.md#principled-implementation Two named same-surface rest landmarks are resolved canonically and their three-axis Euclidean norm reports the sliding-caliper distance in metres.
 * @evidence contracts/common.md#clear-and-simple-design humanHeadPoint owns registration/surface admission; this reader owns the fixed norm and role-keyed marker result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No population distance, missing-point mirror or consumer-specific offset modifies the actual rest coordinates.
 * @evidence contracts/common.md#meaningful-documentation The comment states straight rest-skin caliper distance; the rule/result types distinguish endpoint names, metre value and markers.
 * @evidence contracts/performance.md#efficient-algorithms Two source-name lookups and fixed three-axis hypot use constant expected work apart from key processing, with two vectors and one result record.
 * @evidence contracts/performance.md#reuse-equivalent-work Each resolved point is used for both norm and markers; no repeated-lookup or cross-head result cache is introduced.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fresh point records transfer in the reading and borrowed source arrays remain caller-owned, without native handles, tasks or persistent dictionaries.
 */
export function readHumanLandmarkDistance(
  head: IAutoMovieHumanHeadSkin,
  rule: IAutoMovieHumanLandmarkDistanceMeasurement,
): IAutoMovieHumanHeadReading {
  const from: IAutoMovieVector3 = humanHeadPoint(head, rule.from);
  const to: IAutoMovieVector3 = humanHeadPoint(head, rule.to);
  return {
    metres: Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z),
    points: { [rule.from]: from, [rule.to]: to },
  };
}
