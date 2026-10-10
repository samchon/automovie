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
