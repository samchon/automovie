import type { IAutoMovieConstructionOutline } from "./IAutoMovieConstructionOutline";

/**
 * The world coordinates of a parallel-plane course's origin, each a source
 * curve in the same authored station parameter, in metres.
 */
export interface IAutoMovieConstructionParallelOrigin {
  /** World X in metres as a function of station in metres. */
  x: IAutoMovieConstructionOutline;

  /** World Y in metres as a function of the same station. */
  y: IAutoMovieConstructionOutline;

  /** World Z in metres as a function of the same station. */
  z: IAutoMovieConstructionOutline;
}
