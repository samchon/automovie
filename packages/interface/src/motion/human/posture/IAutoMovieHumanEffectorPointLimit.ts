import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * An effector-local point and its maximum world displacement in metres from the
 * goal's requested rigid pose. Limb fitting and tool trajectories share this
 * physical tolerance.
 */
export interface IAutoMovieHumanEffectorPointLimit {
  /** The point from the end joint in its own frame, metres. */
  contact: IAutoMovieVector3;

  /**
   * The largest displacement from where the goal's point and rotation place it,
   * metres.
   */
  bound: number;
}
