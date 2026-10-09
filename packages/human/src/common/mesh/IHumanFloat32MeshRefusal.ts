import type { IAutoMovieMeshPhysicalSource, IAutoMovieVector3 } from "@automovie/interface";

/**
 * Actual source and converted values of one refused Float32 triangle.
 * All refusals use the existing orientation predicate and source incidence.
 *
 * @evidence contracts/common.md#principled-implementation Records the exact buffers and area vectors the conversion guard compared.
 * @evidence contracts/common.md#clear-and-simple-design One named record describes every refused face.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reporting changes no verdict or triangle population.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes local conversion from original-source redundancy classification.
 * @evidence contracts/modeling.md#spatial-conventions Positions are in the input local metre frame; origin restores the source frame when supplied.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Carries existing corner ordinals.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no input.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Records rather than changes geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The producer owns physical aliases.
 * @evidenceExclude contracts/modeling.md#rendered-observation A numerical refusal is not a frame.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no anatomical fact.
 * @evidenceExclude contracts/anatomy.md#permitted-range The original guard owns the condition.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no shaping input.
 */
export interface IHumanFloat32MeshRefusal {
  /** Zero-based triangle ordinal in the original index sequence. */
  face: number;
  /** Original vertex ordinals in the refused triangle winding order. */
  corners: number[];
  /** Input-local oriented twice-area vector before quantization, in square metres. */
  before: IAutoMovieVector3;
  /** Input-local oriented twice-area vector after Float32 quantization, in square metres. */
  after: IAutoMovieVector3;
  /** Local source edge lengths and minimum altitude describe the actual triangle's conditioning. */
  edgeLengthsMetres: number[];
  /** Twice-area magnitude divided by the longest local edge; null when nonfinite. */
  minimumAltitudeMetres: number | null;
  /** Local triangle aspect ratio; null when its computation is nonfinite. */
  longestEdgeOverMinimumAltitude: number | null;
  /** Cosine between the original and converted area vectors; null when undefined. */
  orientationAgreement: number | null;
  /** Input-local metre coordinates of the three original corners. */
  positions: number[][];
  /** Float32-rounded input-local metre coordinates of the same corners. */
  float32: number[][];
  /** Corresponding metric-reference coordinates used for redundancy classification. */
  sourcePositions: number[][];
  /** Optional translation from the input-local frame to its source frame. */
  origin: IAutoMovieVector3 | null;
  /** Converted coordinates restored by the supplied translation; unknown without that frame. */
  translatedFloat32: number[][] | null;
  /** Existing physical-source aliases for each corner, or null when absent. */
  physical: (IAutoMovieMeshPhysicalSource | null)[];
}
