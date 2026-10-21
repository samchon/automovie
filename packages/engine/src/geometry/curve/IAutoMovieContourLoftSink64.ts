import type { IAutoMovieCurve64 } from "./IAutoMovieCurve64";

/**
 * Synchronous destination for one source-free contour kernel invocation.
 * Callback exceptions propagate unchanged and never become a numerical partial.
 * The sink owns capacity admission, storage and any file lifecycle it acquires.
 *
 * @evidence contracts/common.md#principled-implementation Original index, face order and millimetre generating vectors reach one explicit channel owner.
 * @evidence contracts/common.md#clear-and-simple-design Vertex, triangle and generating-curve delivery remain separate from kernel correspondence and metadata.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source geometry, alternate normal or positional alias enters through this output-only contract.
 * @evidence contracts/common.md#meaningful-documentation Members state units, synchronous borrowing, original ordering and callback failure propagation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased callback contract chooses no storage algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The generating invocation owns shared identities once.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrowed vectors and curve points must be consumed synchronously or copied into paid sink storage; the contract owns no hidden buffer or handle.
 */
export interface IAutoMovieContourLoftSink64 {
  /** Consume one original indexed position in millimetres before any face uses it. */
  vertex: (index: number, pointMm: IAutoMovieCurve64.Vector) => void;

  /** Consume one face in original face and corner order; every index was delivered. */
  triangle: (a: number, b: number, c: number) => void;

  /** Consume one actual closed generating ring; positions and phase lookup are borrowed synchronously and remain in millimetres. */
  construction: (
    id: string,
    pointsMm: readonly IAutoMovieCurve64.Vector[],
    phase: (pointMm: IAutoMovieCurve64.Vector) => number,
  ) => void;
}
