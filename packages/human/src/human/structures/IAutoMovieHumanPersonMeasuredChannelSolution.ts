import type { IAutoMovieHumanPersonDocument } from "./IAutoMovieHumanPersonDocument";
import type { IAutoMovieHumanPersonMeasurementReading } from "./IAutoMovieHumanPersonMeasurementReading";

/**
 * A solved person measurement: the new document, the reading of its final
 * Float32 skin, and whether the target lies within the population the
 * measurement's source observed.
 *
 * @evidence contracts/common.md#principled-implementation The requested target, the remeasured value and the population standing are reported separately.
 * @evidence contracts/common.md#clear-and-simple-design Three fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A target outside the source population is reported, not refused or clamped.
 * @evidence contracts/common.md#meaningful-documentation States what each field holds.
 * @evidence contracts/anatomy.md#anatomical-source States whether the target lies within the cited source population.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The solution defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The document carries the solved channel; the solution defines none.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The solution emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The reading owns its metres and frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The solution builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The solution is not displayed by itself.
 * @evidenceExclude contracts/anatomy.md#permitted-range The inverse owns the reach; the population standing is no bound.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The solver converted the input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonMeasuredChannelSolution {
  /** The person with the solved body channel; everything else unchanged. */
  document: IAutoMovieHumanPersonDocument;

  /** The reading of the solved person's final Float32 skin. */
  reading: IAutoMovieHumanPersonMeasurementReading;

  /** Whether the target lies within the range the measurement's source sample observed. */
  population: "within-source-sample" | "outside-source-sample";
}
