import type { IAutoMovieContourLoft64 } from "./IAutoMovieContourLoft64";

/**
 * Actual contour emission populations and unchanged qualification metadata.
 * Channel contents belong to the explicitly supplied synchronous sink.
 *
 * @evidence contracts/development/design.md#principled-representation Counts and ranges retain the generating kernel's original curve and triangle order without substituting a placeholder mesh.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Geometry channel ownership is separate from contour incidence and quality metadata.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This report does not claim that sink channels have been published, rendered or canonically validated.
 * @evidence contracts/development/common.md#meaningful-documentation Counts describe successful synchronous callback delivery and retain original qualification arrays.
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
