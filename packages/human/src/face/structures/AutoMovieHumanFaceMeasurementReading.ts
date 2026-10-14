import type { IAutoMovieHumanFaceMeasurementMeasured } from "./IAutoMovieHumanFaceMeasurementMeasured";
import type { IAutoMovieHumanFaceMeasurementUnavailable } from "./IAutoMovieHumanFaceMeasurementUnavailable";

/**
 * One build's reading of a registered face measurement: a value on the final
 * surface, or a named gap.
 *
 * @evidence contracts/common.md#principled-implementation The status-discriminated union retains a final-surface measured value or the instrument's named unavailable reason. Registry qualifications travel with measured observations rather than becoming unregistered clinical readings.
 * @evidence contracts/common.md#clear-and-simple-design Measured and Unavailable own their distinct fields, keeping target/residual information out of a named-gap alternative.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A target never replaces the actual reading, and a missing instrument or nonfinite result does not become a default value or successful measurement.
 * @evidence contracts/common.md#meaningful-documentation The comment states one-build final-surface scope and the two outcomes; their declarations detail units, requested values and qualifications.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This union runs no measurement instrument or residual computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no repeated registry evaluation or reading cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The reading type owns no geometry buffers or measurement task; the resulting observation list belongs to the caller.
 *
 * @author Samchon
 */
export type AutoMovieHumanFaceMeasurementReading =
  | IAutoMovieHumanFaceMeasurementMeasured
  | IAutoMovieHumanFaceMeasurementUnavailable;
