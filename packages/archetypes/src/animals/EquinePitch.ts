import { AutoMovieGravity, Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieTransform } from "@automovie/interface";

import { ArchetypeFrame } from "../core";

/**
 * The trunk's pitch through a jump: nose-up about the hips over the push-off, a ballistic flight, nose-down about the shoulders over the landing stance.
 *
 * The hinds stay planted through the push-off. A rigid trunk can therefore rise only by turning nose-up about the hip axis, which keeps the hips, and the planted hinds' reach, where they are. The angle grows from rest at constant angular acceleration, so φ = φ_T (τ/Δ)², until the root's vertical velocity at final hind liftoff equals the flight's own takeoff velocity. The landing mirrors this about the shoulder axis over the first fore stance. Between the two the root flies the ballistic parabola that meets both contact heights, and the pitch and the root's fore-aft offset follow cubic Hermite curves that match the angle, the offset and their rates at both ends. Height, pitch and their rates are thus continuous from the push-off to the end of the landing stance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the mechanism, the profiles and the continuity they give.
 * @evidence contracts/development/design.md#principled-representation Pivot heights and fore-aft positions in model metres, film seconds, and pitch angles in radians, positive nose-up.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Planned by the ride's flight clock and read by its body placement.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The angles follow from the flight and the actual pivots; none is authored.
 */
export namespace EquinePitch {
  /**
   * A lateral pivot axis of the trunk.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame.
   * @evidence contracts/development/design.md#principled-representation Height and fore-aft position in model metres; the axis is the model's X.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The hips and the shoulders.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IPivot {
    /** Height, metres. */
    y: number;
    /** Fore-aft position, metres, positive forward. */
    z: number;
  }

  /**
   * A planned pitch.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the seconds, pivots and angles.
   * @evidence contracts/development/design.md#principled-representation The four contact seconds, the two pivots and the takeoff and landing angles.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `at`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IPlan {
    /** Film second both hinds are down. */
    push: number;
    /** Film second of final hind liftoff. */
    takeoff: number;
    /** Film second of first fore landing. */
    landing: number;
    /** Film second the first fore stance ends. */
    absorb: number;
    /** The hip axis. */
    hip: IPivot;
    /** The shoulder axis. */
    shoulder: IPivot;
    /** Nose-up angle at final hind liftoff, radians. */
    rise: number;
    /** Angle at first fore landing, radians, negative nose-down. */
    dive: number;
  }

  /**
   * The root's offset from its course placement and the trunk's pitch at one second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame and units.
   * @evidence contracts/development/design.md#principled-representation A model-frame height and fore-aft offset in metres and a pitch in radians.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Applied by the ride's body placement.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ITilt {
    /** Height offset, metres. */
    y: number;
    /** Fore-aft offset, metres. */
    z: number;
    /** Pitch, radians, positive nose-up. */
    pitch: number;
  }

  /**
   * Plan the pitch for a flight.
   *
   * @param hip The hip axis.
   * @param shoulder The shoulder axis.
   * @param push Both hinds down, film seconds.
   * @param takeoff Final hind liftoff.
   * @param landing First fore landing.
   * @param absorb End of the first fore stance.
   * @returns The plan.
   * @throws {RangeError} When no pitch below a right angle reaches the flight's takeoff or landing velocity.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the failure.
   * @evidence contracts/development/implementation.md#principled-implementation The root's height under a pivot turned by φ is y = h_y(1 − cos φ) − h_z sin φ; its velocity at the end of the push-off is (2φ/Δ)(h_y sin φ − h_z cos φ). The ballistic flight between the two contact heights fixes both contact velocities, (y_L − y_T)/T ± g T/2. A fixed-point iteration alternates the two angles with these velocities, each angle found by bisection.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Velocities from heights, angles from velocities, repeated.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unreachable velocity refuses rather than clamping the angle.
   * @evidence contracts/development/implementation.md#efficient-algorithms A fixed 20 outer rounds of two 60-step bisections.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the root-height formulas with `at`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one record.
   */
  export function plan(
    hip: IPivot,
    shoulder: IPivot,
    push: number,
    takeoff: number,
    landing: number,
    absorb: number,
  ): IPlan {
    const flight: number = landing - takeoff;
    let rise: number = 0;
    let dive: number = 0;
    for (let round: number = 0; round < 20; round++) {
      const span: number =
        (height(shoulder, dive) - height(hip, rise)) / flight;
      const up: number = span + (AutoMovieGravity.STANDARD * flight) / 2;
      const down: number = span - (AutoMovieGravity.STANDARD * flight) / 2;
      rise = solve(
        (angle: number): number =>
          ((2 * angle) / (takeoff - push)) * climb(hip, angle),
        up,
        1,
      );
      dive = solve(
        (angle: number): number =>
          ((-2 * angle) / (absorb - landing)) * climb(shoulder, angle),
        down,
        -1,
      );
    }
    return { push, takeoff, landing, absorb, hip, shoulder, rise, dive };
  }

  /**
   * The tilt at a film second.
   *
   * @param pitch The plan.
   * @param seconds The film second.
   * @returns The tilt; zero outside the push-off, flight and landing stance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result outside the jump.
   * @evidence contracts/development/implementation.md#principled-implementation Push-off and landing turn about their pivots with the quadratic angle profiles; the flight is ballistic in height with cubic Hermite pitch and fore-aft offset matching both ends.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per phase.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the pivot formulas with `plan`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function at(pitch: IPlan, seconds: number): ITilt {
    const { push, takeoff, landing, absorb, hip, shoulder, rise, dive } = pitch;
    if (!(seconds > push && seconds < absorb)) return { y: 0, z: 0, pitch: 0 };
    if (seconds <= takeoff)
      return turned(hip, rise * ((seconds - push) / (takeoff - push)) ** 2);
    if (seconds >= landing)
      return turned(
        shoulder,
        dive * ((absorb - seconds) / (absorb - landing)) ** 2,
      );
    const flight: number = landing - takeoff;
    const tau: number = seconds - takeoff;
    const start: ITilt = turned(hip, rise);
    const end: ITilt = turned(shoulder, dive);
    const spin: number = (2 * rise) / (takeoff - push);
    const settle: number = (-2 * dive) / (absorb - landing);
    const up: number =
      (end.y - start.y) / flight + (AutoMovieGravity.STANDARD * flight) / 2;
    return {
      y: start.y + up * tau - (AutoMovieGravity.STANDARD * tau * tau) / 2,
      z: hermite(
        start.z,
        spin * along(hip, rise),
        end.z,
        settle * along(shoulder, dive),
        tau / flight,
        flight,
      ),
      pitch: hermite(rise, spin, dive, settle, tau / flight, flight),
    };
  }

  /**
   * The body's world placement: a course placement turned about the body's up axis by a lateral figure's heading offset, then offset and pitched by a jump's tilt in the body's own frame.
   *
   * @param placement The course placement.
   * @param yaw The heading offset, degrees, positive to the left.
   * @param tilt The jump's tilt, if any.
   * @returns The placement unchanged without either, else a new one.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frames, units and the unchanged case.
   * @evidence contracts/development/implementation.md#principled-implementation Compose the course rotation with the yaw about +Y and the nose-up pitch about +X (a negative right-handed turn), and add the tilt's offset rotated by the course rotation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One composition.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the engine's quaternion and vector arithmetic.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one fresh transform.
   */
  export function place(
    placement: IAutoMovieTransform,
    yaw: number,
    tilt: ITilt | undefined,
  ): IAutoMovieTransform {
    if (yaw === 0 && (tilt === undefined || (tilt.y === 0 && tilt.pitch === 0)))
      return placement;
    return {
      translation: Vector3.add(
        placement.translation,
        Quaternion.rotateVector(placement.rotation, {
          x: 0,
          y: tilt?.y ?? 0,
          z: tilt?.z ?? 0,
        }),
      ),
      rotation: Quaternion.multiply(
        Quaternion.multiply(
          placement.rotation,
          Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, yaw),
        ),
        Quaternion.fromAxisAngle(
          { x: 1, y: 0, z: 0 },
          (-(tilt?.pitch ?? 0) * 180) / Math.PI,
        ),
      ),
      scale: ArchetypeFrame.UNIT,
    };
  }

  /** The root's offset and the pitch when the trunk is turned by an angle about a pivot. */
  function turned(pivot: IPivot, angle: number): ITilt {
    return {
      y: height(pivot, angle),
      z: pivot.y * Math.sin(angle) + pivot.z * (1 - Math.cos(angle)),
      pitch: angle,
    };
  }

  /** The root's height offset when turned by an angle about a pivot. */
  function height(pivot: IPivot, angle: number): number {
    return pivot.y * (1 - Math.cos(angle)) - pivot.z * Math.sin(angle);
  }

  /** The root's height per radian of turn about a pivot. */
  function climb(pivot: IPivot, angle: number): number {
    return pivot.y * Math.sin(angle) - pivot.z * Math.cos(angle);
  }

  /** The root's fore-aft offset per radian of turn about a pivot. */
  function along(pivot: IPivot, angle: number): number {
    return pivot.y * Math.cos(angle) + pivot.z * Math.sin(angle);
  }

  /** The cubic Hermite value at a share of an interval. */
  function hermite(
    p0: number,
    m0: number,
    p1: number,
    m1: number,
    s: number,
    length: number,
  ): number {
    const s2: number = s * s;
    const s3: number = s2 * s;
    return (
      (2 * s3 - 3 * s2 + 1) * p0 +
      (s3 - 2 * s2 + s) * length * m0 +
      (-2 * s3 + 3 * s2) * p1 +
      (s3 - s2) * length * m1
    );
  }

  /** Bisect a monotone velocity law for the angle that reaches a velocity, on a quarter turn toward a sign. */
  function solve(
    law: (angle: number) => number,
    target: number,
    sign: number,
  ): number {
    let low: number = 0;
    let high: number = (sign * Math.PI) / 2;
    if (
      !(Math.abs(law(high)) >= Math.abs(target)) ||
      Math.sign(target) !== Math.sign(law(high))
    )
      throw new RangeError(
        `No trunk pitch below a right angle reaches ${target} m/s through the jump's contact`,
      );
    for (let step: number = 0; step < 60; step++) {
      const middle: number = (low + high) / 2;
      if (Math.abs(law(middle)) < Math.abs(target)) low = middle;
      else high = middle;
    }
    return (low + high) / 2;
  }
}
