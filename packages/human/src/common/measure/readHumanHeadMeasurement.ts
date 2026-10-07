import type { IAutoMovieHumanHeadMeasurement } from "./IAutoMovieHumanHeadMeasurement";
import type { IAutoMovieHumanHeadReading } from "./IAutoMovieHumanHeadReading";
import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";
import { readHumanHeadBreadth } from "./readHumanHeadBreadth";
import { readHumanHeadCircumference } from "./readHumanHeadCircumference";
import { readHumanHeadLength } from "./readHumanHeadLength";
import { readHumanLandmarkDistance } from "./readHumanLandmarkDistance";
import { readHumanTragionTop } from "./readHumanTragionTop";

/**
 * Read one head rule on a head view at rest, by its kind.
 *
 * @evidence contracts/common.md#principled-implementation Each kind has one instrument; this only dispatches.
 * @evidence contracts/common.md#clear-and-simple-design One switch over five kinds.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every kind reaches its own instrument; none is approximated by another.
 * @evidence contracts/common.md#meaningful-documentation States the dispatch.
 * @evidence contracts/modeling.md#spatial-conventions Readings are metres of the person frame.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The instruments cite their protocols.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing; its reading carries the points a render marks.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing; the rule's range is a report.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
 */
export function readHumanHeadMeasurement(
  head: IAutoMovieHumanHeadSkin,
  rule: IAutoMovieHumanHeadMeasurement,
): IAutoMovieHumanHeadReading {
  switch (rule.kind) {
    case "tragion-top":
      return readHumanTragionTop(head, rule);
    case "head-length":
      return readHumanHeadLength(head, rule);
    case "head-breadth":
      return readHumanHeadBreadth(head, rule);
    case "landmark-distance":
      return readHumanLandmarkDistance(head, rule);
    case "head-circumference":
      return readHumanHeadCircumference(head, rule);
  }
}
