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
  face: number;
  corners: number[];
  before: IAutoMovieVector3;
  after: IAutoMovieVector3;
  /** Local source edge lengths and minimum altitude describe the actual triangle's conditioning. */
  edgeLengthsMetres: number[];
  minimumAltitudeMetres: number | null;
  longestEdgeOverMinimumAltitude: number | null;
  orientationAgreement: number | null;
  positions: number[][];
  float32: number[][];
  sourcePositions: number[][];
  origin: IAutoMovieVector3 | null;
  /** Converted coordinates restored by the supplied translation; unknown without that frame. */
  translatedFloat32: number[][] | null;
  physical: (IAutoMovieMeshPhysicalSource | null)[];
}
