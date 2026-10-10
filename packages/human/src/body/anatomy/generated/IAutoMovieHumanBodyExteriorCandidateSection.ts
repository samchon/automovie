import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Final Float32 section plane and source-owned component selection seed.
 * Emitted-surface readback uses the same point, normal and seed as the solver.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyExteriorCandidateSection {
  /**
   * Station on the rule's landmark segment, in metres in the source-rest
   * frame, where the plane through the shaped witness vertex meets it.
   */
  readonly point: IAutoMovieVector3;

  /**
   * Unit normal of the instrument's cutting plane in the source-rest frame.
   * Horizontal girth rules use +Y; perpendicular rules derive their normal
   * from the oriented landmark segment used by that instrument.
   */
  readonly normal: IAutoMovieVector3;

  /**
   * Position whose nearest closed loop, by centroid distance across every
   * cut surface, is the measured component; currently equal to `point`.
   */
  readonly seed: IAutoMovieVector3;
}
