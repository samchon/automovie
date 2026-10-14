import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * Long hamstring head arising at the ischial tuberosity and crossing both hip and knee. It remains separate from the short femoral head.
 *
 * This named belly accepts physical volume or MRI fat fraction, never skin vertices.
 *
 * @evidence contracts/common.md#principled-implementation A separate long-head biceps femoris alias preserves independently authored/observed muscle volume and fat-fraction records.
 * @evidence contracts/common.md#clear-and-simple-design Long-head ownership stays distinct from the short head while quantitative structure is shared.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The long-head request is not a duplicate short-head solid or inferred skin volume.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes the long head's anatomical ownership and scalar measurement surface.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Long-head biceps typing runs no posterior-thigh generation or measurement algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Long-head identity contains no cached hamstring volume or composition result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This long-head alias acquires no segmented muscle asset or active instrument.
 * @author Samchon
 */
export type IAutoMovieHumanBodyBicepsFemorisLongHeadMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
