import type { IAutoMovieContourLoft64 } from "./IAutoMovieContourLoft64";

/**
 * Delivered vertex and triangle counts with contour qualification records. The
 * synchronous sink owns channel storage. Counts describe callbacks completed by
 * a successful generator invocation.
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
