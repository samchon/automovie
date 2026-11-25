import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Secondary spring dynamics advanced by position Verlet integration with
 * explicit caller-owned history and timestep. Replaying requires the same
 * complete driver, composed frame, local transforms, collider list and history;
 * state and dt alone do not determine the trajectory.
 *
 * ResolveFrame steps it only with explicit spring state and dt, otherwise
 * returning a deferred descriptor. Each non-root joint receives damped inertia,
 * gravity and stiffness pull, then local-length projection followed by ordered
 * sphere projections. Rotation and scale stay animated, and descendants outside
 * the chain are not recomposed. Invalid scalar parameters and missing
 * node/local records encountered by the step throw.
 */
export interface IAutoMovieSpringDriver {
  /** Selects the spring driver. */
  type: "spring";

  /**
   * Joint chain, root to tip; the spring writes world positions after the first
   * joint. A chain shorter than two moves no joint, though centre history can
   * still update.
   */
  chain: string[];

  /**
   * Nonnegative rest-pull rate per second; each step moves stiffness * dt of
   * the way toward rest without capping that factor.
   */
  stiffness: number;

  /** Damping in `[0, 1]`; inertia is scaled by `(1 - drag)`. */
  drag: number;

  /**
   * Nonnegative gravity acceleration in m/s²; each step adds gravityPower * dt²
   * along normalized gravityDir.
   */
  gravityPower: number;

  /** World gravity direction: any finite non-zero vector, normalized per step. */
  gravityDir: IAutoMovieVector3;

  /**
   * Positive joint collision radius in metres, added to each collider sphere's
   * radius.
   */
  hitRadius: number;

  /**
   * Node whose world translation since the previous step is added to each
   * joint's prior position; rotation is not compensated. Null measures inertia
   * in world space. Centre history uses the JSON-encoded [center, ordered
   * chain] tuple, while joint history uses joint ids; the caller owns history
   * lifetime and removal/reset.
   */
  center: string | null;
}
