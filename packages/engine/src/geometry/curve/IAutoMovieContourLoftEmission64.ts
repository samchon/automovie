import type { IAutoMovieContourLoft64 } from "./IAutoMovieContourLoft64";

/**
 * Actual contour emission populations and unchanged qualification metadata.
 * Channel contents belong to the explicitly supplied synchronous sink.
 *
 * @evidence contracts/common.md#principled-implementation Counts and ranges retain the generating kernel's original curve and triangle order without substituting a placeholder mesh.
 * @evidence contracts/common.md#clear-and-simple-design Geometry channel ownership is separate from contour incidence and quality metadata.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This report does not claim that sink channels have been published, rendered or canonically validated.
 * @evidence contracts/common.md#meaningful-documentation Counts describe successful synchronous callback delivery and retain original qualification arrays.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The erased report performs no generation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One generator supplies the actual populations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The sink owns channel storage; this metadata retains no geometry arrays or handles.
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
