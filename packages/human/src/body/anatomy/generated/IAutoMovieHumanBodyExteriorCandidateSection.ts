import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Final Float32 section plane and source-owned component selection seed.
 * Emitted-surface readback uses the same point, normal and seed as the solver.
 *
 * @evidence contracts/common.md#clear-and-simple-design Gives the section witness one reusable named interface.
 * @evidence contracts/common.md#meaningful-documentation States the section's coordinate and readback responsibility.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyExteriorCandidateSection {
  /**
   * Station on the rule's landmark segment, in metres in the source-rest
   * frame, where the plane through the shaped witness vertex meets it.
   */
  readonly point: IAutoMovieVector3;

  /**
   * Unit normal of the cutting plane; the horizontal girth rule this report
   * requires gives `+Y` (0, 1, 0).
   */
  readonly normal: IAutoMovieVector3;

  /**
   * Position whose nearest closed loop, by centroid distance across every
   * cut surface, is the measured component; currently equal to `point`.
   */
  readonly seed: IAutoMovieVector3;
}
