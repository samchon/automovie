import { AutoMovieGravity, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/** The projectile with a push built over `TAKE`, at `t` seconds. */
function position(
  origin: IAutoMovieVector3,
  velocity: IAutoMovieVector3,
  push: IAutoMovieVector3,
  t: number,
): IAutoMovieVector3 {
  const g: number = AutoMovieGravity.STANDARD;
  const built: number = Math.min(t, HumanUnseatFlight.TAKE);
  const after: number = Math.max(0, t - HumanUnseatFlight.TAKE);
  // The push's displacement: t^2 / (2 TAKE) while it builds, then its full velocity.
  const pushed: number = (built * built) / (2 * HumanUnseatFlight.TAKE) + after;
  return {
    x: origin.x + velocity.x * t + push.x * pushed,
    y: origin.y + velocity.y * t + push.y * pushed - 0.5 * g * t * t,
    z: origin.z + velocity.z * t + push.z * pushed,
  };
}

/** The least positive root of a t^2 + b t + c = 0, if any. */
function first(a: number, b: number, c: number): number | undefined {
  if (Math.abs(a) < 1e-12) return b < 0 ? -c / b : undefined;
  const d: number = b * b - 4 * a * c;
  if (d < 0) return undefined;
  const roots: number[] = [
    (-b + Math.sqrt(d)) / (2 * a),
    (-b - Math.sqrt(d)) / (2 * a),
  ].filter((t: number): boolean => t > 0);
  return roots.length === 0 ? undefined : Math.min(...roots);
}

/**
 * Solve a flight from its release to the height `floor`.
 *
 * @param origin The root at the release.
 * @param velocity Its velocity then.
 * @param push The velocity the fall adds.
 * @param floor The root's height when it lands.
 * @returns The flight.
 */
export function HumanUnseatFlight(
  origin: IAutoMovieVector3,
  velocity: IAutoMovieVector3,
  push: IAutoMovieVector3,
  floor: number,
): HumanUnseatFlight.IFlight {
  const g: number = AutoMovieGravity.STANDARD;
  const drop: number = origin.y - floor;
  // In the push phase the height above the landing is drop + vy t + (py / (2 TAKE) - g / 2) t^2.
  const a: number = push.y / (2 * HumanUnseatFlight.TAKE) - g / 2;
  const early: number | undefined = first(a, velocity.y, drop);
  let land: number;
  if (drop <= 0) land = 0;
  else if (early !== undefined && early <= HumanUnseatFlight.TAKE) land = early;
  else {
    const top: IAutoMovieVector3 = position(
      origin,
      velocity,
      push,
      HumanUnseatFlight.TAKE,
    );
    const rise: number = velocity.y + push.y - g * HumanUnseatFlight.TAKE;
    land =
      HumanUnseatFlight.TAKE +
      (rise + Math.sqrt(rise * rise + 2 * g * (top.y - floor))) / g;
  }
  const landed: IAutoMovieVector3 = {
    ...position(origin, velocity, push, land),
    y: floor,
  };
  const level: IAutoMovieVector3 = {
    x: velocity.x + push.x * Math.min(1, land / HumanUnseatFlight.TAKE),
    y: 0,
    z: velocity.z + push.z * Math.min(1, land / HumanUnseatFlight.TAKE),
  };
  return {
    origin,
    velocity,
    push,
    land,
    landed,
    slide: level,
    stop: Vector3.length(level) / (HumanUnseatFlight.FRICTION * g),
  };
}

/**
 * The closed-form path of a rider leaving a saddle (`HumanUnseat`): from the
 * release the root keeps the saddle's velocity and gains the fall's push over
 * `TAKE` seconds at a constant rate, so the velocity has no jump; it flies
 * under standard gravity to the height it lies or stands at, then slides on the
 * floor under Coulomb friction until it stops.
 */
export namespace HumanUnseatFlight {
  /** Seconds the fall's push builds over (provisional). */
  export const TAKE: number = 0.2;

  /** Sliding friction of a clothed body on turf (provisional). */
  export const FRICTION: number = 0.5;

  /** One flight. */
  export interface IFlight {
    /** The root at the release. */
    origin: IAutoMovieVector3;

    /** The root's velocity at the release. */
    velocity: IAutoMovieVector3;

    /** The velocity the fall adds over `TAKE`. */
    push: IAutoMovieVector3;

    /** Seconds from the release to the landing. */
    land: number;

    /** The root at the landing. */
    landed: IAutoMovieVector3;

    /** The root's level velocity on landing. */
    slide: IAutoMovieVector3;

    /** Seconds from the landing until the slide stops. */
    stop: number;
  }

  /**
   * The root at a second after the release: flying until the landing, then
   * sliding to a stop.
   *
   * @param flight The flight.
   * @param t Seconds from the release.
   * @returns World metres.
   */
  export function at(flight: IFlight, t: number): IAutoMovieVector3 {
    if (t <= flight.land)
      return position(
        flight.origin,
        flight.velocity,
        flight.push,
        Math.max(0, t),
      );
    const s: number = Math.min(flight.stop, t - flight.land);
    const speed: number = Vector3.length(flight.slide);
    if (speed < 1e-9) return flight.landed;
    const run: number =
      speed * s - 0.5 * FRICTION * AutoMovieGravity.STANDARD * s * s;
    return Vector3.add(flight.landed, Vector3.scale(flight.slide, run / speed));
  }
}
