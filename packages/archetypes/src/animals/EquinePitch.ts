import { AutoMovieGravity, Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieTransform } from "@automovie/interface";

import { AutoMovieArchetypeFrame } from "../core";

/**
 * The trunk's height and pitch through a jump: the push-off, a flight about the
 * centre of mass, and the landing stance.
 *
 * In the air the horse is a body under gravity alone: its centre of mass flies
 * a parabola and its trunk turns nose-down at a nearly constant rate. Galloux
 * and Barrey 1997 (Components of the total kinetic moment in jumping horses,
 * Equine Vet J Suppl 23:41, https://doi.org/10.1111/j.2042-3306.1997.tb05051.x;
 * thirty horses over a 1.20 m fence) report a rotation of 120 ± 5 degrees per
 * second, nearly constant through the airborne phase; Clayton, St George,
 * Sinclair and Hobbs 2021 (Characteristics of the flight arc in horses jumping
 * three different types of fences in Olympic competition, J Equine Vet Sci
 * 104:103698, https://doi.org/10.1016/j.jevs.2021.103698, Table 1; twelve
 * Olympic horses) report the trunk 30.7 degrees nose-up at takeoff and 37.8
 * nose-down at landing over a 1.60 m vertical, an average 110.38 degrees per
 * second in a 0.62 s flight. The trunk here turns at `TURN` through the flight,
 * level at its middle, so it leaves the ground nose-up by half the flight's
 * turn and lands nose-down by as much: a derivation from those two reports.
 *
 * The push-off and the landing stance are the two contacts. Over the push-off,
 * from both hinds down to final hind liftoff, the centre of mass rises from
 * rest under a constant net force to the flight's takeoff velocity, and the
 * pitch rises from level at rest to the takeoff angle and the flight's rate (a
 * cubic Hermite curve, so the trunk is most nose-up shortly before liftoff and
 * is already turning nose-down as it leaves). The landing stance mirrors this,
 * from the flight's landing velocity and rate to rest. The three phases fix the
 * takeoff velocity in closed form, so height, pitch and both rates are
 * continuous from the push-off to the end of the landing stance. The turn about
 * the centre of mass lowers the hips, which lie behind it, as the forehand
 * rises, so the planted hinds are crouched at takeoff.
 */
export namespace EquinePitch {
  /**
   * The trunk's nose-down turn through a jump's flight, radians per second:
   * Clayton et al. 2021's average trunk angular velocity over the 1.60 m
   * vertical, 110.38 ± 9.63 degrees per second, Table 1.
   */
  export const TURN: number = (110.38 * Math.PI) / 180;

  /** A point of the trunk in its sagittal plane. */
  export interface IPivot {
    /** Height, metres. */
    y: number;
    /** Fore-aft position, metres, positive forward. */
    z: number;
  }

  /** A planned jump. */
  export interface IPlan {
    /** Film second both hinds are down. */
    push: number;
    /** Film second of final hind liftoff. */
    takeoff: number;
    /** Film second of first fore landing. */
    landing: number;
    /** Film second the first fore stance ends. */
    absorb: number;
    /** The rest centre of mass. */
    centre: IPivot;
    /** Nose-up angle at final hind liftoff, radians. */
    rise: number;
    /** The flight's pitch rate, radians per second, negative nose-down. */
    turn: number;
    /**
     * The centre of mass's vertical velocity at final hind liftoff, metres per
     * second.
     */
    launch: number;
  }

  /**
   * The root's offset from its course placement and the trunk's pitch at one
   * second.
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
   * Plan the trunk through a jump.
   *
   * @param centre The rest centre of mass.
   * @param push Both hinds down, film seconds.
   * @param takeoff Final hind liftoff.
   * @param landing First fore landing.
   * @param absorb End of the first fore stance.
   * @returns The plan.
   */
  export function plan(
    centre: IPivot,
    push: number,
    takeoff: number,
    landing: number,
    absorb: number,
  ): IPlan {
    const flight: number = landing - takeoff;
    const g: number = AutoMovieGravity.STANDARD;
    return {
      push,
      takeoff,
      landing,
      absorb,
      centre,
      rise: (TURN * flight) / 2,
      turn: -TURN,
      launch:
        (g * flight * (flight + absorb - landing)) /
        (2 * flight + takeoff - push + absorb - landing),
    };
  }

  /**
   * The tilt at a film second.
   *
   * @param pitch The plan.
   * @param seconds The film second.
   * @returns The tilt; zero outside the push-off, flight and landing stance.
   */
  export function at(pitch: IPlan, seconds: number): ITilt {
    const { push, takeoff, landing, absorb, centre, rise, turn, launch } =
      pitch;
    if (!(seconds > push && seconds < absorb)) return { y: 0, z: 0, pitch: 0 };
    const g: number = AutoMovieGravity.STANDARD;
    const flight: number = landing - takeoff;
    let height: number;
    let angle: number;
    if (seconds <= takeoff) {
      const tau: number = seconds - push;
      height = (launch * tau * tau) / (2 * (takeoff - push));
      angle = hermite(0, 0, rise, turn, tau / (takeoff - push), takeoff - push);
    } else if (seconds >= landing) {
      const left: number = absorb - seconds;
      height =
        (-(launch - g * flight) * left * left) / (2 * (absorb - landing));
      angle = hermite(
        rise + turn * flight,
        turn,
        0,
        0,
        (seconds - landing) / (absorb - landing),
        absorb - landing,
      );
    } else {
      const tau: number = seconds - takeoff;
      height =
        (launch * (takeoff - push)) / 2 + launch * tau - (g * tau * tau) / 2;
      angle = rise + turn * tau;
    }
    const turned: ITilt = about(centre, angle);
    return { ...turned, y: turned.y + height };
  }

  /**
   * The body's world placement: a course placement turned about the body's up
   * axis by a lateral figure's heading offset, then offset and pitched by a
   * tilt in the body's own frame.
   *
   * @param placement The course placement.
   * @param yaw The heading offset, degrees, positive to the left.
   * @param tilt The tilt, if any.
   * @returns The placement unchanged without either, else a new one.
   */
  export function place(
    placement: IAutoMovieTransform,
    yaw: number,
    tilt: ITilt | undefined,
  ): IAutoMovieTransform {
    if (
      yaw === 0 &&
      (tilt === undefined || (tilt.y === 0 && tilt.z === 0 && tilt.pitch === 0))
    )
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
      scale: AutoMovieArchetypeFrame.UNIT,
    };
  }

  /**
   * A placement pitched by a lean about its own root on the floor.
   *
   * @param placement The placement.
   * @param degrees The lean, degrees, positive nose-down.
   * @returns The placement unchanged without a lean, else a new one.
   */
  export function lean(
    placement: IAutoMovieTransform,
    degrees: number,
  ): IAutoMovieTransform {
    return degrees === 0
      ? placement
      : place(placement, 0, about({ y: 0, z: 0 }, (-degrees * Math.PI) / 180));
  }

  /**
   * The root's offset and the pitch when the trunk is turned by an angle about
   * a lateral pivot axis.
   *
   * @param pivot The pivot axis in model metres.
   * @param angle Radians, positive nose-up.
   * @returns The tilt.
   */
  export function about(pivot: IPivot, angle: number): ITilt {
    return {
      y: pivot.y * (1 - Math.cos(angle)) - pivot.z * Math.sin(angle),
      z: pivot.y * Math.sin(angle) + pivot.z * (1 - Math.cos(angle)),
      pitch: angle,
    };
  }

  /**
   * How far a tilt moves a point of the trunk forward.
   *
   * @param tilt The tilt.
   * @param point The point, model metres.
   * @returns The fore-aft displacement in the course's frame, metres, positive
   *   forward.
   */
  export function shift(tilt: ITilt, point: IPivot): number {
    return (
      tilt.z -
      point.y * Math.sin(tilt.pitch) +
      point.z * (Math.cos(tilt.pitch) - 1)
    );
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
}
