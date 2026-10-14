import type { IAutoMovieMeshPhysicalSource, IAutoMovieVector3 } from "@automovie/interface";

/**
 * Actual source and converted values of one refused Float32 triangle.
 * All refusals use the existing orientation predicate and source incidence.
 *
 * @evidence contracts/common.md#principled-implementation Actual original/converted triangle vectors, incidence, conditioning and reference positions diagnose refusal; optional translation and source aliases describe lineage without changing the orientation predicate.
 * @evidence contracts/common.md#clear-and-simple-design Diagnostic data stays separate from precision admission and visual/anatomical judgment.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No replacement triangle or fitted coordinate is embedded, and null marks unavailable conditioning/origin/lineage information.
 * @evidence contracts/common.md#meaningful-documentation Fields give face ordinals, square-metre/metre quantities, before/after frames, nullable meanings and physical source correspondence.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This diagnostic shape calculates no conversion or conditioning algorithm; the converter supplies its values.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record coordinates no repeated operation or mutable-mesh diagnostic cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Copied triangle data and borrowed source records live with the diagnostic receiver, without native handles, tasks or a persistent registry.
 *
 *
 * @author Samchon
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
