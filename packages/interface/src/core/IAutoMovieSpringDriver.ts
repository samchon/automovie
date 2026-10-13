import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Secondary spring dynamics (hair, skirt, tail): the engine's archetype
 * integrated-but-deterministic driver, modelled on VRM SpringBone and stepped
 * with Verlet integration at the fixed timestep, so it replays identically.
 */
export interface IAutoMovieSpringDriver {
  /** Discriminator. */
  type: "spring";

  /** Joint chain, root → tip, whose rotations the spring writes. */
  chain: string[];

  /** Restoring force toward the rest pose. */
  stiffness: number;

  /** Damping `[0, 1]`; inertia is scaled by `(1 - drag)`. */
  drag: number;

  /** Gravity magnitude per step. */
  gravityPower: number;

  /** Gravity direction (unit). */
  gravityDir: IAutoMovieVector3;

  /** Collision sphere radius of the joints, meters. */
  hitRadius: number;

  /**
   * Reference node in whose frame inertia is evaluated (so the chain ignores
   * body locomotion while gravity stays world-space), or `null`.
   */
  center: string | null;
}
