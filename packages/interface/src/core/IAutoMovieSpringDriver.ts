import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Secondary spring dynamics (hair, skirt, tail): the engine's one stateful
 * driver, modelled on VRM SpringBone and advanced by position Verlet
 * integration with the caller's timestep, so the same state and `dt` replay
 * identically.
 *
 * It steps only when `resolveFrame` receives `springs` state and `dt`;
 * otherwise it is returned in `deferredDrivers`. Each step leaves `chain[0]` on
 * its animation and, for every later joint in order, carries inertia damped by
 * `drag`, adds gravity, pulls toward the joint's rest offset by
 * `stiffness × dt`, restores the joint's local translation length from the
 * already-stepped parent, then pushes the joint out of every collider sphere
 * enlarged by `hitRadius`. Only joint world positions are written: rotations
 * stay animated, and descendants outside the chain are not recomposed.
 * Non-finite or out-of-range parameters and a chain or center node missing
 * from the frame throw.
 *
 * @evidence contracts/common.md#principled-implementation `stepSpring` is position Verlet: the next position is `current + (current - previous) × (1 - drag) + gravityDir × gravityPower × dt²`, moved `stiffness × dt` of the way to the rest position, projected back onto the bone length, then pushed out of penetrated spheres in the VRM order; the premises are a positive `dt` and a pull factor at most 1, and a larger product overshoots the rest position because nothing caps it.
 * @evidence contracts/common.md#clear-and-simple-design The driver holds only the per-chain parameters while the cross-frame memory lives in the caller's `IAutoMovieSpringState`, so the record stays plain data and one state can serve every spring in a scene.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid drag, stiffness, gravity, radius, direction or timestep throws instead of being clamped, and a spring without state is deferred to the caller rather than skipped; the center memory is keyed by center node alone, so a second spring stepped with the same center in the same frame sees no center motion, a defect that remains open.
 * @evidence contracts/common.md#meaningful-documentation States when the driver steps, the order of the integration terms, units of gravity and radius, the valid ranges, which joints are written and which are not, the center compensation and its limit, and each throwing case.
 * @author Samchon
 */
export interface IAutoMovieSpringDriver {
  /** Selects the spring driver. */
  type: "spring";

  /**
   * Joint chain, root to tip; the spring writes the world positions of every
   * joint after the first, and a chain shorter than two moves nothing.
   */
  chain: string[];

  /**
   * Pull toward the rest offset per second, non-negative: each step moves a
   * joint `stiffness × dt` of the way toward its rest position.
   */
  stiffness: number;

  /** Damping in `[0, 1]`; inertia is scaled by `(1 - drag)`. */
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
   * Node whose world translation since the previous step is added to each
   * joint's previous position, so the chain ignores that node's travel while
   * gravity stays world-space; its rotation is not compensated. `null` measures
   * inertia in world space. The state remembers one position per center node,
   * so only the first spring stepped with a given center in a frame sees its
   * motion.
   */
  center: string | null;
}
