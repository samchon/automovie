import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { DefenseShape } from "./DefenseShape";
import type { IFighterMeasure } from "./IFighterMeasure";

/**
 * The turnover of the descending (Brazilian) kick in the kicker's own body
 * frame: the hips roll over, a posterior pelvic tilt and a hike of the
 * kicking hip let the thigh climb past the flexion the hip alone allows, the
 * knee rises as high as the thigh can carry it while the lower leg still
 * reaches the target, and the instep and distal shin, which meet at the
 * ankle's front, come down onto the region from that knee. Its range follows from the same geometry, so the
 * stance distance is the one at which the shape itself lands.
 *
 * ```ts
 * const { knee, point } = TurnoverShape.impact(hip, target, measure);
 * TurnoverShape.range(attacker, receiver); // stance-origin distance
 * ```
 *
 * @evidence docs/research/kickboxing/brazilian-kick.md#law Turnover: the hips roll over and the knee climbs above the receiver's shoulder line; the lower leg descends onto the region.
 * @evidence docs/research/kickboxing/brazilian-kick.md#conclusion The hip alone runs out of range; the pelvis supplies the missing degrees.
 * @evidence docs/research/kickboxing/techniques.md#reach Range is measured on the two bodies.
 */
export namespace TurnoverShape {
  /** Hip flexion of the turnover, degrees: inside Human's 132.1° clinical limit by a tenth, so the fit keeps room. */
  export const HIP_FLEXION: number = 120;

  /** Posterior pelvic tilt of the turnover, degrees: the trunk "leans back" read as thirty degrees. */
  export const TILT: number = 30;

  /** Lumbar flexion against the tilt, degrees: half of it, so the trunk leans back only to counterbalance and the head stays up with the eyes on the target. */
  export const COUNTER: number = 15;

  /** Hike of the kicking hip, degrees of pelvic obliquity: the hips "roll over", a third of the channel's ninety. */
  export const HIKE: number = 30;

  /**
   * The kicking hip's height at the turnover: the straight support leg's hip
   * raised by the hike across half the pelvis.
   *
   * @param measure The kicker's measure.
   * @returns Metres above the floor.
   */
  export function hip(measure: IFighterMeasure): number {
    return measure.hip + measure.hipHalfWidth * Math.sin(radians(HIKE));
  }

  /**
   * The lower leg's reach from the knee to the striking surface: the shank,
   * to the ankle's front where the instep and the distal shin meet; past
   * the head the pointed foot wraps behind it, its top facing back onto
   * the region.
   *
   * @param measure The kicker's measure.
   * @returns Metres.
   */
  export function lower(measure: IFighterMeasure): number {
    return measure.shank;
  }

  /**
   * The knee and ankle goals at contact: the knee as high as the thigh can
   * carry it while the lower leg reaches the target (the top of the circle
   * where the thigh's and lower leg's spheres meet, or on the line when they
   * do not), and the ankle on the target, where the instep and distal shin
   * meet.
   *
   * @param hip The kicking hip, body frame.
   * @param target The struck region, body frame.
   * @param measure The kicker's measure.
   * @returns The knee aim and the ankle goal.
   */
  export function impact(
    hip: IAutoMovieVector3,
    target: IAutoMovieVector3,
    measure: IFighterMeasure,
  ): { knee: IAutoMovieVector3; point: IAutoMovieVector3 } {
    const a: number = measure.thigh;
    const b: number = lower(measure);
    const d: IAutoMovieVector3 = Vector3.subtract(target, hip);
    const length: number = Vector3.length(d);
    const u: IAutoMovieVector3 = Vector3.normalize(d);
    let knee: IAutoMovieVector3;
    if (length >= a + b || length <= Math.abs(a - b))
      knee = Vector3.add(hip, Vector3.scale(u, a));
    else {
      const along: number = (a * a - b * b + length * length) / (2 * length);
      const radius: number = Math.sqrt(Math.max(0, a * a - along * along));
      const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
      const lift: IAutoMovieVector3 = Vector3.subtract(
        up,
        Vector3.scale(u, Vector3.dot(up, u)),
      );
      knee = Vector3.add(
        Vector3.add(hip, Vector3.scale(u, along)),
        Vector3.scale(Vector3.normalize(lift), radius),
      );
    }
    return { knee, point: target };
  }

  /**
   * The ankle at the top of the turnover: the lower leg raised a shank above
   * the impact knee, leaning toward the target by half, so the foot comes
   * down onto the region from above.
   *
   * @param knee The impact knee, body frame.
   * @param target The struck region, body frame.
   * @param measure The kicker's measure.
   * @returns The ankle goal at the apex.
   */
  export function apex(
    knee: IAutoMovieVector3,
    target: IAutoMovieVector3,
    measure: IFighterMeasure,
  ): IAutoMovieVector3 {
    const toward: IAutoMovieVector3 = Vector3.subtract(target, knee);
    return Vector3.add(
      knee,
      Vector3.scale(
        Vector3.normalize({ x: toward.x / 2, y: 1, z: toward.z / 2 }),
        measure.shank,
      ),
    );
  }

  /**
   * The stance-origin distance at which the turnover lands: the thigh's
   * horizontal run at the turnover's elevation (hip flexion plus posterior
   * tilt above the horizontal) plus the lower leg's horizontal run from
   * that knee to the region behind the ear. The region lies on the head's
   * side at its centre line, a head radius and a half below its top, after
   * the receiver's elbow block has sunk him; the descending kick reaches it
   * there, so no region depth is added.
   *
   * @param attacker The kicker's measure.
   * @param receiver The receiver's measure.
   * @returns Metres.
   */
  export function range(
    attacker: IFighterMeasure,
    receiver: IFighterMeasure,
  ): number {
    const elevation: number = radians(HIP_FLEXION + TILT - 90);
    const knee: number = hip(attacker) + attacker.thigh * Math.sin(elevation);
    const region: number =
      receiver.head - 1.5 * receiver.headRadius - DefenseShape.sink(receiver);
    const b: number = lower(attacker);
    const rise: number = Math.min(b, Math.abs(region - knee));
    return (
      attacker.thigh * Math.cos(elevation) + Math.sqrt(b * b - rise * rise)
    );
  }

  function radians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}
