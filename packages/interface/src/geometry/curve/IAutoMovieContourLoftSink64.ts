import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";

/**
 * Synchronous destination for one source-free contour kernel invocation.
 * Callback exceptions propagate unchanged and never become a numerical partial.
 * The sink owns capacity admission, storage and any file lifecycle it acquires.
 *
 * @evidence contracts/development/design.md#principled-representation Original index, face order and millimetre generating vectors reach one explicit channel owner.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Vertex, triangle and generating-curve delivery remain separate from kernel correspondence and metadata.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No source geometry, alternate normal or positional alias enters through this output-only contract.
 * @evidence contracts/development/common.md#meaningful-documentation Members state units, synchronous borrowing, original ordering and callback failure propagation.
 */
export interface IAutoMovieContourLoftSink64 {
  /**
   * Consume one original indexed position in millimetres before any face uses it.
   */
  vertex: (index: number, pointMm: Readonly<AutoMovieVector3Tuple>) => void;

  /**
   * Consume one face in original face and corner order; every index was delivered.
   */
  triangle: (a: number, b: number, c: number) => void;

  /**
   * Consume one actual closed generating ring. Positions and phase lookup are
   * borrowed synchronously; position inputs remain in millimetres.
   */
  construction: (
    id: string,
    pointsMm: readonly Readonly<AutoMovieVector3Tuple>[],
    phase: (pointMm: Readonly<AutoMovieVector3Tuple>) => number,
  ) => void;
}
