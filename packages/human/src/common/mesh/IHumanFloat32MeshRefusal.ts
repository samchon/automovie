import type { IAutoMovieMeshPhysicalSource, IAutoMovieVector3 } from "@automovie/interface";

/**
 * Actual source and converted values of one refused Float32 triangle.
 * All refusals use the existing orientation predicate and source incidence.
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
