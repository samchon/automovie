import type { IAutoMovieHumanHeadReading } from "./IAutoMovieHumanHeadReading";
import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";
import type { IAutoMovieHumanLandmarkDistanceMeasurement } from "./IAutoMovieHumanLandmarkDistanceMeasurement";
import { humanHeadPoint } from "./humanHeadPoint";

/**
 * Read the straight distance between two named head view skin points at
 * rest, as a sliding caliper reads it.
 */
export function readHumanLandmarkDistance(
  head: IAutoMovieHumanHeadSkin,
  rule: IAutoMovieHumanLandmarkDistanceMeasurement,
): IAutoMovieHumanHeadReading {
  const from = humanHeadPoint(head, rule.from);
  const to = humanHeadPoint(head, rule.to);
  return {
    metres: Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z),
    points: { [rule.from]: from, [rule.to]: to },
  };
}
