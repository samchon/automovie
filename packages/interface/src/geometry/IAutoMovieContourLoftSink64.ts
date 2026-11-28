import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";

/**
 * Synchronous destination for generated contour positions, faces and
 * construction. The sink owns storage, capacity and any acquired files. A
 * callback exception aborts generation and propagates unchanged.
 */
export interface IAutoMovieContourLoftSink64 {
  /**
   * Consume one position in millimetres at its assigned output index before any
   * face references it. Copy the tuple to retain independent storage.
   */
  vertex: (index: number, pointMm: Readonly<AutoMovieVector3Tuple>) => void;

  /**
   * Consume one face in original face and corner order; every index was
   * delivered.
   */
  triangle: (a: number, b: number, c: number) => void;

  /**
   * Consume one generating ring in millimetres after face delivery. The phase
   * reader uses the supplied point objects. Borrow the ring and reader only
   * during the callback.
   */
  construction: (
    id: string,
    pointsMm: readonly Readonly<AutoMovieVector3Tuple>[],
    phase: (pointMm: Readonly<AutoMovieVector3Tuple>) => number,
  ) => void;
}
