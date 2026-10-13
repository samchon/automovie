import type { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * Secondary-motion config: the joints that should lag/overshoot the animated
 * target (a tail, ears) and the spring that drives them.
 *
 * @author Samchon
 */
export interface IAutoMovieSpringConfig {
  /**
   * Humanoid slots whose sampled pose axes use this player's secondary springs.
   */
  joints: AutoMovieHumanoidBone[];

  /**
   * Stiffness parameter passed verbatim to the engine's dampedSpring solver.
   */
  stiffness: number;

  /** Damping parameter passed with the same stiffness to that solver. */
  damping: number;
}
