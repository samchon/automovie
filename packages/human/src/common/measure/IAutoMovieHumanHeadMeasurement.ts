import type { IAutoMovieHumanHeadBreadthMeasurement } from "./IAutoMovieHumanHeadBreadthMeasurement";
import type { IAutoMovieHumanHeadCircumferenceMeasurement } from "./IAutoMovieHumanHeadCircumferenceMeasurement";
import type { IAutoMovieHumanHeadLengthMeasurement } from "./IAutoMovieHumanHeadLengthMeasurement";
import type { IAutoMovieHumanLandmarkDistanceMeasurement } from "./IAutoMovieHumanLandmarkDistanceMeasurement";
import type { IAutoMovieHumanTragionTopMeasurement } from "./IAutoMovieHumanTragionTopMeasurement";

/**
 * A head measurement rule the person evaluates on the head view of its skin at
 * rest (`HUMAN_HEAD_MEASUREMENTS`).
 *
 * @evidence contracts/common.md#principled-implementation One union lets one reader dispatch every head rule by kind.
 * @evidence contracts/common.md#clear-and-simple-design Five kinds.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Each kind names the points and areas its instrument reads.
 * @evidence contracts/common.md#meaningful-documentation States where the rules are read.
 * @evidence contracts/modeling.md#spatial-conventions Every kind reads metres of the person frame at rest.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The rule defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The rule defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The rule emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The rule builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The rule is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Each member and table entry cites its definition.
 * @evidenceExclude contracts/anatomy.md#permitted-range The union admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The union converts no input.
 *
 * @author Samchon
 */
export type IAutoMovieHumanHeadMeasurement =
  | IAutoMovieHumanTragionTopMeasurement
  | IAutoMovieHumanHeadLengthMeasurement
  | IAutoMovieHumanHeadBreadthMeasurement
  | IAutoMovieHumanLandmarkDistanceMeasurement
  | IAutoMovieHumanHeadCircumferenceMeasurement;
