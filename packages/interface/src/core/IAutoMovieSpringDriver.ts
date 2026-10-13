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
 * @evidence contracts/common.md#principled-implementation Position Verlet with a hard distance constraint after VRM SpringBone: next = cur + (cur - prev)(1 - drag) + g dt², then a `stiffness·dt` pull toward the parent-rotated rest offset, the length restore and the sphere push-out; a `stiffness·dt` above one overshoots the rest pose and is not guarded.
 * @evidence contracts/common.md#clear-and-simple-design Six physical parameters, a chain and an optional inertia frame, with cross-frame positions kept outside the driver in `IAutoMovieSpringState` so the authored record stays immutable data.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The collider push follows the length constraint, the VRM order, so a hit may stretch a bone for one step; a joint exactly at a sphere centre is pushed along `+Y`, the one fixed fallback, and invalid parameters throw instead of being clamped.
 * @evidence contracts/common.md#meaningful-documentation States when the driver steps or defers, the order of one step, that only positions are written, and the unit and range of each parameter.
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
