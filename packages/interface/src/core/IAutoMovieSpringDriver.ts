import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Secondary spring dynamics (hair, skirt, tail): the engine's archetype
 * integrated-but-deterministic driver, modelled on VRM SpringBone and advanced
 * by position Verlet integration with the caller's timestep, so the same state
 * and `dt` replay identically.
 *
 * It steps only when `resolveFrame` receives `springs` state and `dt`;
 * otherwise it is returned in `deferredDrivers`. Each step leaves `chain[0]` on
 * its animation and, for every later joint in order, carries inertia damped by
 * `drag` (measured relative to `center`), adds gravity, pulls toward the
 * joint's rest offset by `stiffness × dt`, restores the rest bone length from
 * the already-stepped parent, then pushes the joint out of every collider
 * sphere enlarged by `hitRadius`. Only joint world positions are written;
 * rotations stay animated. Non-finite or out-of-range parameters throw.
 *
 * @author Samchon
 */
export interface IAutoMovieSpringDriver {
  /** Discriminator. */
  type: "spring";

  /**
   * Joint chain, root → tip; the spring writes the world positions of every
   * joint after the first.
   */
  chain: string[];

  /**
   * Pull toward the rest offset per second, non-negative: each step moves a
   * joint `stiffness × dt` of the way toward its rest position.
   */
  stiffness: number;

  /** Damping `[0, 1]`; inertia is scaled by `(1 - drag)`. */
  drag: number;

  /**
   * Gravity acceleration in metres per second squared, non-negative; each step
   * adds `gravityPower × dt²` of displacement along `gravityDir`.
   */
  gravityPower: number;

  /** World gravity direction: any finite non-zero vector, normalized per step. */
  gravityDir: IAutoMovieVector3;

  /**
   * Joint collision radius in metres, positive, added to each collider sphere's
   * radius.
   */
  hitRadius: number;

  /**
   * Reference node in whose frame inertia is evaluated (so the chain ignores
   * body locomotion while gravity stays world-space), or `null`.
   */
  center: string | null;
}
