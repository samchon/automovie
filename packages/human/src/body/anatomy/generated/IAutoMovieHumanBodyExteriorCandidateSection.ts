import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Final Float32 section plane and source-owned component selection seed.
 * Emitted-surface readback uses the same point, normal and seed as the solver.
 * @evidence contracts/common.md#clear-and-simple-design Gives the section witness one reusable named interface.
 * @evidence contracts/common.md#meaningful-documentation States the section's coordinate and readback responsibility.
 */
export interface IAutoMovieHumanBodyExteriorCandidateSection {
  readonly point: IAutoMovieVector3;
  readonly normal: IAutoMovieVector3;
  readonly seed: IAutoMovieVector3;
}
