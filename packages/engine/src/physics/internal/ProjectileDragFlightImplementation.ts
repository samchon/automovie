import type {
  IAutoMovieIntegrateMotionTrajectory,
  IAutoMovieMotionTrajectoryInterval,
  IAutoMovieProjectile,
  IAutoMovieProjectileDragInterval,
  IAutoMovieProjectileFlight,
  IAutoMovieProjectileState,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../../math/Vector3";
import { AutoMovieEngineMotionTrajectory } from "../../motion/AutoMovieEngineMotionTrajectory";
import { AutoMovieAir } from "../AutoMovieAir";

/*
 * Private implementation of the projectile operation and its related readers.
 */
export namespace ProjectileDragFlightImplementation {
  /*
   * A projectile's flight under gravity and quadratic drag, read by time: `dx/dt
   * = v`, `dv/dt = gravity - k |v| v` with `k = rho Cd A / (2 m)`, solved by the
   * engine's one fixed-step integrator (`integrateMotionTrajectory`, classical
   * Runge-Kutta read by cubic Hermite) from the launch.
   *
   * The step is chosen once per flight by step doubling (Press et al., Numerical
   * Recipes, 3rd ed., 2007, sec. 17.2): from the integrator's own default step,
   * the step is halved until one step and two half steps from the launch differ,
   * divided by 15 (the fourth-order method's `2^4 - 1`), by no more than
   * `TOLERANCE` metres per second of the step, so the error over a flight of `T`
   * seconds stays near `TOLERANCE T`. The probe starts at the launch with the
   * speed the flight can reach at most: a body faster than its terminal speed
   * `sqrt(|g| / k)` only slows, one slower only approaches it, so the speed never
   * exceeds the larger of the two, where the drag's acceleration is largest. With
   * zero drag and nonzero gravity the global speed bound is Infinity; the finite
   * launch speed suffices for the step probe because acceleration is constant.
   * The halving stops at the 52 bits of a double's mantissa, past which a step
   * cannot shrink.
   *
   * The flight is integrated in chunks of `CHUNK` steps, each started from the
   * previous chunk's end, so a read far along the flight integrates only up to
   * its chunk, and every chunk depends on the launch alone: reads in any order
   * give the same values. Finite times before launch read the launch state;
   * nonfinite requests throw before any chunks are allocated. Projectile data
   * must remain unchanged while its reader is used.
   * Parameter projectile: A projectile with drag.
   * Returns: The flight's reader.
   * When launch vectors, speed/gravity norms, drag
   * coefficients or their derived positive-drag bound are invalid or
   * unrepresentable; reader methods also reject nonfinite times.
   */
  export function projectileDragFlight(
    projectile: IAutoMovieProjectile,
  ): IAutoMovieProjectileFlight {
    const drag: IAutoMovieProjectile.IDrag = projectile.drag!;
    const density: number = drag.density ?? AutoMovieAir.DENSITY;
    for (const [name, value] of [
      ["coefficient", drag.coefficient],
      ["area", drag.area],
      ["density", density],
    ] as const)
      if (value < 0)
        throw new RangeError(
          `projectile drag ${name} must be non-negative, but was ${value}`,
        );
    if (drag.mass <= 0)
      throw new RangeError(
        `projectile drag mass must be positive, but was ${drag.mass}`,
      );
    const zeroDrag: boolean =
      density === 0 || drag.coefficient === 0 || drag.area === 0;
    const k: number = zeroDrag
      ? 0
      : (density * drag.coefficient * drag.area) / drag.mass / 2;
    if (!zeroDrag && k === 0)
      throw new RangeError(
        "projectile drag factor must retain its positive magnitude",
      );
    // The density, coefficient and area product can overflow binary64.
    if (k === Infinity)
      throw new RangeError("projectile drag factor overflows binary64");
    const g: IAutoMovieVector3 = projectile.gravity;
    const f = (
      _: number,
      x: readonly number[],
    ): IAutoMovieIntegrateMotionTrajectory.IRate => {
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
    const gravity: number = Vector3.length(g);

    const terminal: number =
      gravity > 0 ? (k > 0 ? Math.sqrt(gravity / k) : Infinity) : 0;

    const fastest: number = Math.max(v0, terminal);
    const probeSpeed: number = k === 0 ? v0 : fastest;
    const along: IAutoMovieVector3 =
      v0 > 0
        ? Vector3.scale(projectile.velocity, probeSpeed / v0)
        : gravity > 0
          ? Vector3.scale(g, probeSpeed / gravity)
          : { x: 0, y: 0, z: 0 };
    const probe: number[] = [...x0.slice(0, 3), along.x, along.y, along.z];
    let h: number = AutoMovieEngineMotionTrajectory.integrateMotionTrajectoryStep();
    for (let halving: number = 0; halving < 52; halving++) {
      const whole: number[] = AutoMovieEngineMotionTrajectory.integrateMotionTrajectory({
        f,
        x0: probe,
        t0: 0,
        t1: h,
        h,
      }).at(h).x;
      const halves: number[] = AutoMovieEngineMotionTrajectory.integrateMotionTrajectory({
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
      if (error <= DRAG_TOLERANCE * h) break;
      h /= 2;
    }

    // Chunks integrated on demand, in order, each from its predecessor's end.
    const span: number = DRAG_CHUNK * h;
    const chunks: IAutoMovieIntegrateMotionTrajectory.ITrajectory[] = [];
    const chunk = (
      index: number,
    ): IAutoMovieIntegrateMotionTrajectory.ITrajectory => {
      while (chunks.length <= index) {
        const c: number = chunks.length;
        const start: number[] =
          c === 0 ? x0 : chunks[c - 1]!.at(chunks[c - 1]!.t1).x;
        chunks.push(
          AutoMovieEngineMotionTrajectory.integrateMotionTrajectory({
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
    const flight: IAutoMovieProjectileFlight = {
      step: h,
      fastest,
      interval: (seconds: number): IAutoMovieProjectileDragInterval => {
        const t: number = flightTime(seconds);
        const trajectory: IAutoMovieIntegrateMotionTrajectory.ITrajectory = chunk(
          Math.floor(t / span),
        );
        const data: IAutoMovieMotionTrajectoryInterval = trajectory.interval!(t);
        return {
          from: data.from,
          to: data.to,
          start: {
            position: { x: data.start[0]!, y: data.start[1]!, z: data.start[2]! },
            velocity: { x: data.first[0]!, y: data.first[1]!, z: data.first[2]! },
          },
          end: {
            position: { x: data.end[0]!, y: data.end[1]!, z: data.end[2]! },
            velocity: { x: data.last[0]!, y: data.last[1]!, z: data.last[2]! },
          },
        };
      },
      at: (seconds: number): IAutoMovieProjectileState => {
        const t: number = flightTime(seconds);
        const x: number[] = chunk(Math.floor(t / span)).at(t).x;
        return {
          position: { x: x[0]!, y: x[1]!, z: x[2]! },
          velocity: { x: x[3]!, y: x[4]!, z: x[5]! },
        };
      },
    };
    return flight;
  }

  /*
   * The error a flight may gather per second, metres: a tenth of the millimetre
   * within which a flight's arrival is accepted (#3470: an arrow's arrival
   * within 1 ms and 1 mm), so a flight of up to ten seconds stays inside it.
   */
  export const DRAG_TOLERANCE: number = 1e-4;

  /*
   * Steps per chunk: a memory bound no flight reads, about a thousand knots of
   * six numbers per chunk.
   */
  export const DRAG_CHUNK: number = 1024;


  /*
   * Reject an unbounded chunk request before allocation; finite prelaunch reads
   * hold the launch.
   */
  const flightTime = (seconds: number): number => {
    if (seconds === Infinity)
      throw new RangeError("projectile flight time must be bounded");
    return Math.max(0, seconds);
  };
}
