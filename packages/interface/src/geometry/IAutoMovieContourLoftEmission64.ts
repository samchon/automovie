import type { IAutoMovieContourLoft64 } from "./IAutoMovieContourLoft64";

/**
 * Actual contour emission populations and unchanged qualification metadata.
 * Channel contents belong to the explicitly supplied synchronous sink.
 */
export interface IAutoMovieContourLoftEmission64 extends Omit<
  IAutoMovieContourLoft64.IResult,
  "mesh" | "construction"
> {
  /** Number of delivered vertices, in their original engine index order. */
  vertices: number;

  /** Number of delivered triangles, in original face and corner order. */
  triangles: number;
}
