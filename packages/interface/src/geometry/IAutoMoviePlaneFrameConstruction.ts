import type { AutoMovieVector3Tuple, IAutoMoviePlaneFrame } from "../index";

/** Construction of an oriented physical frame for Recovery section cuts. */

export namespace IAutoMoviePlaneFrameConstruction {
  /**
   * Build a right-handed plane frame from a finite Cartesian origin, nonzero
   * normal and nonparallel reference direction.
   *
   * @param origin Finite physical origin, retained as supplied.
   * @param normal Finite nonzero oriented plane direction.
   * @param reference Finite direction whose planar projection defines v.
   * @returns Unit axes and the input origin in the source frame.
   */

  export type Operation = (
    origin: AutoMovieVector3Tuple,
    normal: AutoMovieVector3Tuple,
    reference: AutoMovieVector3Tuple,
  ) => IAutoMoviePlaneFrame;
}
