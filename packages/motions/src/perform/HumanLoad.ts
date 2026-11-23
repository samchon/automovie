import { AutoMovieGravity, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanForce,
  IAutoMovieMotionHumanLoad,
  IAutoMovieMotionHumanSustainedForce,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanForce } from "./HumanForce";

/**
 * Loads, a moving support and slips: the one owner of a carried mass leaning a
 * body, of a support's acceleration acting on its rider, and of a planted
 * foot's required friction.
 *
 * - **Load.** A mass `m` carried `d` ahead of the body's centre, along its
 *   facing, moves the combined centre `m d / (M + m)` ahead. The body leans
 *   back about its base as an inverted pendulum of its own mass `M` at its
 *   centre's height `h` until the moments balance, `M h sin θ = m d`, which
 *   puts the combined centre back over the base (static moment balance).
 * - **Moving support.** A support accelerating at `a` acts on its rider as the
 *   inertial force `-M a` at the centre of mass, a sustained force of the force
 *   input (`HumanForce.ISustained`). Held still, the force shifts the centre of
 *   pressure by `h a / g`; the rider tips over the base's edge when that shift
 *   passes the base's half-length along it, the static tipping bound.
 * - **Slip.** A planted foot holds while the friction it needs, the horizontal
 *   over the vertical ground reaction, stays within the surface's coefficient
 *   (Coulomb). The reactions of the bearing feet sum to `M (a + g)` with `a`
 *   the centre's acceleration, so the ratio is `|a_h| / (g + a_y)` whatever
 *   their share: the required coefficient of friction, as the research defines
 *   it after Redfern et al. 2001 (not yet read at the source).
 *
 * First pass: the lean is the whole body's about its base, not split between
 * the trunk and the ankles; the required friction ignores the swing leg's own
 * dynamics, as the definition does.
 */
export namespace HumanLoad {
  /**
   * The backward lean that balances a carried load, degrees about the base,
   * positive forward; null when the load's moment exceeds the body's own at a
   * right angle, which no lean balances.
   *
   * @param props The body's mass and centre height, and the load's mass and its
   *   distance ahead of the centre.
   * @returns Degrees, or null.
   */
  export function lean(
    props: IAutoMovieMotionHumanLoad.ILeanProps,
  ): number | null {
    const ratio: number =
      (props.load * props.ahead) / (props.mass * props.height);
    if (Math.abs(ratio) > 1) return null;
    return (-Math.asin(ratio) * 180) / Math.PI;
  }

  /**
   * The inertial force a support's acceleration puts on its rider, as a
   * sustained force at the centre of mass.
   *
   * @param subject The rider.
   * @param mass The rider's mass, kilograms.
   * @param acceleration The support's acceleration at a film second, world
   *   m/s².
   * @param from Film seconds, start.
   * @param to Film seconds, end.
   * @returns The force, `-M a`.
   */
  export function inertial(
    subject: string,
    mass: number,
    acceleration: (seconds: number) => IAutoMovieVector3,
    from: number,
    to: number,
  ): IAutoMovieMotionHumanSustainedForce {
    return {
      kind: "sustained",
      subject,
      at: { bone: "hips", point: { x: 0, y: 0, z: 0 } },
      from,
      to,
      force: (seconds: number): IAutoMovieVector3 =>
        Vector3.scale(acceleration(seconds), -mass),
    };
  }

  /**
   * Whether a rider held still on a support accelerating horizontally tips over
   * the base's edge: the centre of pressure's shift `h |a| / g` past the base's
   * half-length along the acceleration.
   *
   * @param acceleration The support's horizontal acceleration, m/s².
   * @param height The rider's centre-of-mass height, metres.
   * @param half The base's half-length along the acceleration, metres.
   * @param gravity Gravitational acceleration, m/s²; standard when absent.
   * @returns Whether the rider must step, grab or fall.
   */
  export function tips(
    acceleration: number,
    height: number,
    half: number,
    gravity: number = AutoMovieGravity.STANDARD,
  ): boolean {
    return (height * Math.abs(acceleration)) / gravity > half;
  }

  /**
   * The friction coefficient the bearing feet need, the horizontal over the
   * vertical ground reaction implied by the centre's acceleration.
   *
   * @param acceleration The centre of mass's acceleration, world m/s².
   * @param gravity Gravitational acceleration, m/s²; standard when absent.
   * @returns The required coefficient; infinite when the body is not pressed
   *   onto the floor.
   */
  export function required(
    acceleration: IAutoMovieVector3,
    gravity: number = AutoMovieGravity.STANDARD,
  ): number {
    const vertical: number = gravity + acceleration.y;
    if (!(vertical > 0)) return Number.POSITIVE_INFINITY;
    return Math.hypot(acceleration.x, acceleration.z) / vertical;
  }

  /**
   * The sum of the sustained forces on a person at a second.
   *
   * @param forces The forces.
   * @param subject The person.
   * @param seconds Film seconds.
   * @returns World newtons.
   */
  export function sustained(
    forces: readonly IAutoMovieMotionHumanForce[],
    subject: string,
    seconds: number,
  ): IAutoMovieVector3 {
    let sum: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    for (const f of HumanForce.within(forces, subject, seconds, seconds))
      if (f.kind === "sustained")
        sum = Vector3.add(sum, HumanForce.at(f, seconds));
    return sum;
  }
}
