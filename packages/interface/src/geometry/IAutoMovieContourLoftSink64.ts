import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";

/**
 * Synchronous destination for one source-free contour kernel invocation.
 * Callback exceptions propagate unchanged and never become a numerical partial.
 * The sink owns capacity admission, storage and any file lifecycle it
 * acquires.
 */
export interface IAutoMovieContourLoftSink64 {
  /**
   * Consume one original indexed position in millimetres before any face uses
   * it.
   */
  vertex: (index: number, pointMm: Readonly<AutoMovieVector3Tuple>) => void;

  /**
   * Consume one face in original face and corner order; every index was
   * delivered.
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
