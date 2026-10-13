/**
 * Coarse creature-style hints attached to a gait.
 *
 * These are normalized multipliers, not physical units: the engine interprets
 * them relative to the target rig and gait. They keep "sneaky", "heavy", or
 * "springy" in data instead of hand-authored TypeScript clips.
 *
 * @author Samchon
 */
export interface IAutoMovieGaitStyle {
  /** Lower the body during the gait. `0` = neutral, `1` = maximum crouch. */
  crouch?: number;

  /** Heavier movement feel. `0` = neutral, `1` = maximum weight. */
  weight?: number;

  /** Extra bounce/rebound. `0` = neutral, `1` = maximum spring. */
  springiness?: number;

  /** Relative stride length. `1` = neutral, below/above shortens/extends. */
  strideScale?: number;
}
