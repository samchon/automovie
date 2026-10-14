import type { IAutoMovieHumanHeadBreadthMeasurement } from "./IAutoMovieHumanHeadBreadthMeasurement";
import type { IAutoMovieHumanHeadCircumferenceMeasurement } from "./IAutoMovieHumanHeadCircumferenceMeasurement";
import type { IAutoMovieHumanHeadLengthMeasurement } from "./IAutoMovieHumanHeadLengthMeasurement";
import type { IAutoMovieHumanLandmarkDistanceMeasurement } from "./IAutoMovieHumanLandmarkDistanceMeasurement";
import type { IAutoMovieHumanTragionTopMeasurement } from "./IAutoMovieHumanTragionTopMeasurement";

/**
 * A head measurement rule the person evaluates on the head view of its skin at
 * rest (`HUMAN_HEAD_MEASUREMENTS`).
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation The five-kind union retains each protocol's own source requirements; readHumanHeadMeasurement dispatches on kind without merging incompatible premises.
 * @evidence contracts/common.md#clear-and-simple-design A closed discriminated union connects existing tragion-top, length, breadth, distance and circumference rules without another option registry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported kinds acquire no fallback result, and constituent records retain their landmark and region semantics.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies rest-head evaluation; the imported rule declarations document their distinct source roles and sample context.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The erased union chooses no runtime algorithm; the dispatcher and individual readers own their costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This union aggregates alternatives without sharing computations across unlike measurement protocols.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no resources; concrete rule ownership stays with person configuration and its dispatched reader.
 */
export type IAutoMovieHumanHeadMeasurement =
  | IAutoMovieHumanTragionTopMeasurement
  | IAutoMovieHumanHeadLengthMeasurement
  | IAutoMovieHumanHeadBreadthMeasurement
  | IAutoMovieHumanLandmarkDistanceMeasurement
  | IAutoMovieHumanHeadCircumferenceMeasurement;
