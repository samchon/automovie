import type { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { integrateMotionTrajectory } from "../motion/integrateMotionTrajectory";
import { AutoMovieAir } from "./AutoMovieAir";
import type { IAutoMovieProjectile } from "./IAutoMovieProjectile";
import type { IAutoMovieProjectileState } from "./IAutoMovieProjectileState";

/**
 * A projectile's flight under gravity and quadratic drag, read by time:
 * `dx/dt = v`, `dv/dt = gravity - k |v| v` with `k = rho Cd A / (2 m)`,
 * solved by the engine's one fixed-step integrator
 * (`integrateMotionTrajectory`, classical Runge-Kutta read by cubic Hermite)
 * from the launch.
 *
 * The step is chosen once per flight by step doubling (Press et al.,
 * Numerical Recipes, 3rd ed., 2007, sec. 17.2): from the integrator's own
 * default step, the step is halved until one step and two half steps from
 * the launch differ, divided by 15 (the fourth-order method's
 * `2^4 - 1`), by no more than `TOLERANCE` metres per second of the step,
 * so the error over a flight of `T` seconds stays near `TOLERANCE T`. The
 * probe starts at the launch with the speed the flight can reach at most:
 * a body faster than its terminal speed `sqrt(|g| / k)` only slows, one
 * slower only approaches it, so the speed never exceeds the larger of the
 * two, where the drag's acceleration is largest. The halving stops at the
 * 52 bits of a double's mantissa, past which a step cannot shrink.
 *
 * The flight is integrated in chunks of `CHUNK` steps, each started from the
 * previous chunk's end, so a read far along the flight integrates only up to
 * its chunk, and every chunk depends on the launch alone: reads in any order
 * give the same values. Times before the launch read the launch state.
 *
 * @param projectile A projectile with drag.
 * @returns The flight's reader.
 * @throws {RangeError} When the drag's mass is not positive, or its coefficient, area or density is negative or not finite.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the equations, the step rule with its source, the speed bound, the chunks and the held start.
 * @evidence contracts/development/implementation.md#principled-implementation The quadratic drag law integrated by classical RK4 at a step from step doubling's error estimate, at the state where the drag's acceleration is largest.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit, choose the step, then integrate chunks lazily in order.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The step comes from a stated tolerance, never from the frame grid; with zero drag the integrator reproduces the closed form, since RK4 and the cubic Hermite are exact for a quadratic path.
 * @evidence contracts/development/implementation.md#efficient-algorithms Four right-hand-side evaluations per step, only up to the chunk read; a read is a chunk index and a Hermite evaluation.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The integrator is the engine's one; the flight is memoised per projectile record, so every read of one launch shares one integration.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The memo is a weak map keyed by the projectile record, so the knots go with the record.
 */
export function projectileDragFlight(
  projectile: IAutoMovieProjectile,
): projectileDragFlight.IFlight {
  const known: projectileDragFlight.IFlight | undefined =
    MEMO.get(projectile);
  if (known !== undefined) return known;
  const drag: IAutoMovieProjectile.IDrag = projectile.drag!;
  const density: number = drag.density ?? AutoMovieAir.DENSITY;
  for (const [name, value] of [
    ["coefficient", drag.coefficient],
    ["area", drag.area],
    ["density", density],
  ] as const)
    if (!(Number.isFinite(value) && value >= 0))
      throw new RangeError(
        `projectile drag ${name} must be finite and non-negative, but was ${value}`,
      );
  if (!(Number.isFinite(drag.mass) && drag.mass > 0))
    throw new RangeError(
      `projectile drag mass must be finite and positive, but was ${drag.mass}`,
    );
  const k: number = (density * drag.coefficient * drag.area) / (2 * drag.mass);
  const g: IAutoMovieVector3 = projectile.gravity;
  const f = (
    _: number,
    x: readonly number[],
  ): integrateMotionTrajectory.IRate => {
    const speed: number = Math.hypot(x[3]!, x[4]!, x[5]!);
    return {
      dx: [
        x[3]!,
        x[4]!,
        x[5]!,
        g.x - k * speed * x[3]!,
        g.y - k * speed * x[4]!,
        g.z - k * speed * x[5]!,
      ],
    };
  };
  const x0: number[] = [
    projectile.origin.x,
    projectile.origin.y,
    projectile.origin.z,
    projectile.velocity.x,
    projectile.velocity.y,
    projectile.velocity.z,
  ];

  // The probe: the launch point moving along the launch direction at the
  // largest speed the flight can reach.
  const v0: number = Vector3.length(projectile.velocity);
  const terminal: number =
    k > 0 && Vector3.length(g) > 0 ? Math.sqrt(Vector3.length(g) / k) : 0;
  const fastest: number = Math.max(v0, terminal);
  const along: IAutoMovieVector3 =
    v0 > 0
      ? Vector3.scale(projectile.velocity, fastest / v0)
      : Vector3.length(g) > 0
        ? Vector3.scale(g, fastest / Vector3.length(g))
        : { x: 0, y: 0, z: 0 };
  const probe: number[] = [...x0.slice(0, 3), along.x, along.y, along.z];
  let h: number = integrateMotionTrajectory.STEP;
  for (let halving: number = 0; halving < 52; halving++) {
    const whole: number[] = integrateMotionTrajectory({
      f,
      x0: probe,
      t0: 0,
      t1: h,
      h,
    }).at(h).x;
    const halves: number[] = integrateMotionTrajectory({
      f,
      x0: probe,
      t0: 0,
      t1: h,
      h: h / 2,
    }).at(h).x;
    const error: number =
      Math.hypot(
        halves[0]! - whole[0]!,
        halves[1]! - whole[1]!,
        halves[2]! - whole[2]!,
      ) / 15;
    if (error <= projectileDragFlight.TOLERANCE * h) break;
    h /= 2;
  }

  // Chunks integrated on demand, in order, each from its predecessor's end.
  const span: number = projectileDragFlight.CHUNK * h;
  const chunks: integrateMotionTrajectory.ITrajectory[] = [];
  const chunk = (index: number): integrateMotionTrajectory.ITrajectory => {
    while (chunks.length <= index) {
      const c: number = chunks.length;
      const start: number[] =
        c === 0 ? x0 : chunks[c - 1]!.at(chunks[c - 1]!.t1).x;
      chunks.push(
        integrateMotionTrajectory({
          f,
          x0: start,
          t0: c * span,
          t1: (c + 1) * span,
          h,
        }),
      );
    }
    return chunks[index]!;
  };
  const flight: projectileDragFlight.IFlight = {
    step: h,
    fastest,
    at: (seconds: number): IAutoMovieProjectileState => {
      const t: number = Math.max(0, seconds);
      const x: number[] = chunk(Math.floor(t / span)).at(t).x;
      return {
        position: { x: x[0]!, y: x[1]!, z: x[2]! },
        velocity: { x: x[3]!, y: x[4]!, z: x[5]! },
      };
    },
  };
  MEMO.set(projectile, flight);
  return flight;
}

/**
 * Companion types and constants of {@link projectileDragFlight}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and why it has its value.
 * @evidence contracts/development/design.md#principled-representation A flight is its chosen step and a reader by time.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What `projectileAt` and a contact search read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The tolerance is derived from the acceptance it serves.
 */
export namespace projectileDragFlight {
  /**
   * The error a flight may gather per second, metres: a tenth of the
   * millimetre within which a flight's arrival is accepted (#3470: an arrow's
   * arrival within 1 ms and 1 mm), so a flight of up to ten seconds stays
   * inside it.
   */
  export const TOLERANCE: number = 1e-4;

  /** Steps per chunk: a memory bound no flight reads, about a thousand knots of six numbers per chunk. */
  export const CHUNK: number = 1024;

  /** A drag flight's reader. */
  export interface IFlight {
    /** The integration step, seconds. */
    step: number;

    /** The largest speed the flight reaches, m/s: the launch speed or the terminal speed, whichever is larger. */
    fastest: number;

    /**
     * The state at a second after the launch.
     *
     * @param seconds Seconds since the launch; before it, the launch state.
     * @returns Position and velocity.
     */
    at(seconds: number): IAutoMovieProjectileState;
  }
}

/** The flights integrated so far, by projectile record. */
const MEMO: WeakMap<IAutoMovieProjectile, projectileDragFlight.IFlight> =
  new WeakMap();
