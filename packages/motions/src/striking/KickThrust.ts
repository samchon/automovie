import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { KickForm } from "./KickForm";

/**
 * A kicking leg as two segments from its hip, and the push kick's thrust:
 * the chamber with the knee lifted to the target's height and the ankle's
 * straight travel from it to the contact (`KickSwing` carries both by the
 * body the leg hangs from).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the leg's two segments, the thrust's chamber and its straight ankle travel, and who carries them.
 * @evidence contracts/development/design.md#principled-representation A leg is two vectors from its hip; the thrust is a function of its share between two such legs.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The leg type, the planted triangle, the drawn chamber and the thrust, each read by KickSwing.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No pose, time or target is retained; the frame is the caller's.
 */
export namespace KickThrust {
  /** A leg from its hip: the thigh to the knee and the shank to the ankle, world metres. */
  export interface ILeg {
    /** From the hip joint to the knee joint. */
    thigh: IAutoMovieVector3;

    /** From the knee joint to the ankle joint. */
    shank: IAutoMovieVector3;
  }

  /**
   * The leg a hip holds on a planted ankle: the two-segment triangle, its
   * knee on the side of the knee the plant was read with (ahead of the body
   * when that knee lies on the hip-to-ankle line). A hip farther from the
   * ankle than the leg is long gives the straight leg toward it, and the
   * shank carries what is missing, so the ankle is still the planted one.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the triangle, the knee's side and the case of a hip beyond the leg's length.
   * @evidence contracts/development/implementation.md#principled-implementation The two-segment triangle from the hip to the ankle by the law of cosines, its apex on the read knee's side of the hip-to-ankle line.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One closed-form construction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A hip farther than the leg is long gives the straight leg and the shank carries the excess; no reach is clamped silently elsewhere.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant arithmetic.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond its result.
   */
  export function planted(
    hip: IAutoMovieVector3,
    ankle: IAutoMovieVector3,
    knee: IAutoMovieVector3,
    lengths: readonly [number, number],
    forward: IAutoMovieVector3,
  ): ILeg {
    const [upper, lower]: readonly [number, number] = lengths;
    const reach: IAutoMovieVector3 = Vector3.subtract(ankle, hip);
    const distance: number = Vector3.length(reach);
    const axis: IAutoMovieVector3 =
      distance > 1e-9
        ? Vector3.scale(reach, 1 / distance)
        : { x: 0, y: -1, z: 0 };
    const span: number = Math.min(
      upper + lower,
      Math.max(Math.abs(upper - lower), distance, 1e-9),
    );
    const along: number = (upper * upper - lower * lower + span * span) / (2 * span);
    const out: number = Math.sqrt(Math.max(0, upper * upper - along * along));
    const side = (toward: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.subtract(toward, Vector3.scale(axis, Vector3.dot(toward, axis)));
    const read: IAutoMovieVector3 = side(Vector3.subtract(knee, hip));
    const bend: IAutoMovieVector3 =
      Vector3.length(read) > 1e-6 ? read : side(forward);
    const thigh: IAutoMovieVector3 = Vector3.add(
      Vector3.scale(axis, along),
      Vector3.length(bend) > 1e-9
        ? Vector3.scale(bend, out / Vector3.length(bend))
        : { x: 0, y: 0, z: 0 },
    );
    return { thigh, shank: Vector3.subtract(reach, thigh) };
  }

  /**
   * A thrust's chamber, drawn from its contact leg in the pelvis's frame:
   * the thigh raised in the vertical plane of the contact's reach until the
   * knee stands at the contact ankle's height, at most
   * `KickForm.PUSH_RAISE_MOST` above the level, and the shank folded under
   * it by the chamber's flexion. The foot then waits under the lifted knee,
   * above whatever stands before the shin, where a chamber that only folds
   * the contact leg's knee hangs it ahead of the knee at the height of an
   * opponent's thigh (measured on the staged lead push kick: the foot met
   * the partner's lead thigh at the chamber key).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the thigh's raise, its bound, the fold and the measured reason.
   * @evidence contracts/development/implementation.md#principled-implementation The knee is put at the contact ankle's height by the thigh's raise in the vertical plane of the contact's reach, bounded by KickForm.PUSH_RAISE_MOST, and the shank is folded from the thigh by the chamber's flexion.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One closed-form construction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The raise is bounded by a named clinical range and the flexion is the kick's own chamber flexion; nothing is fitted to a target or a body.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant arithmetic.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per leg path by its caller.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond its result.
   */
  export function drawn(
    reached: ILeg,
    lengths: readonly [number, number],
    flexion: number,
    up: IAutoMovieVector3,
  ): ILeg {
    const reach: IAutoMovieVector3 = Vector3.add(reached.thigh, reached.shank);
    const height: number = Vector3.dot(reach, up);
    const level: IAutoMovieVector3 = Vector3.subtract(
      reach,
      Vector3.scale(up, height),
    );
    const ahead: IAutoMovieVector3 =
      Vector3.length(level) > 1e-9
        ? Vector3.normalize(level)
        : Vector3.normalize(Vector3.cross({ x: 1, y: 0, z: 0 }, up));
    const most: number = KickForm.PUSH_RAISE_MOST * Quaternion.DEG2RAD;
    const raise: number = Math.min(
      most,
      Math.asin(Math.max(-1, Math.min(1, height / lengths[0]))),
    );
    const fold: number = raise - flexion * Quaternion.DEG2RAD;
    const segment = (length: number, angle: number): IAutoMovieVector3 =>
      Vector3.add(
        Vector3.scale(ahead, length * Math.cos(angle)),
        Vector3.scale(up, length * Math.sin(angle)),
      );
    return {
      thigh: segment(lengths[0], raise),
      shank: segment(lengths[1], fold),
    };
  }

  /**
   * A thrust's leg at a share of its extension: the ankle on the straight
   * line from the chamber's to the contact's, past the contact as far as the
   * least flexion lets the leg reach, and the knee by the two-segment
   * triangle on the side the two ends' knees lie.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the ankle's line, its bound past the contact and the knee's side.
   * @evidence contracts/development/implementation.md#principled-implementation The ankle is interpolated on the straight line between the two ends' ankles in the pelvis's frame and the knee follows by the two-segment triangle, its side read between the two ends' knees.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One closed-form construction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Past the contact the ankle is held within the reach the least flexion gives; the contact leg is met exactly at share one.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant arithmetic.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The two ends and the reach bound are fixed once; each share is evaluated anew.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond its result.
   */
  export function thrusting(
    from: ILeg,
    to: ILeg,
    lengths: readonly [number, number],
    least: number,
  ): (share: number) => ILeg {
    const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    const start: IAutoMovieVector3 = Vector3.add(from.thigh, from.shank);
    const travel: IAutoMovieVector3 = Vector3.subtract(
      Vector3.add(to.thigh, to.shank),
      start,
    );
    const longest: number = Math.sqrt(
      lengths[0] ** 2 +
        lengths[1] ** 2 +
        2 * lengths[0] * lengths[1] * Math.cos(least * Quaternion.DEG2RAD),
    );
    return (share: number): ILeg => {
      const at: IAutoMovieVector3 = Vector3.add(
        start,
        Vector3.scale(travel, share),
      );
      const distance: number = Vector3.length(at);
      const within: number = Math.min(1, Math.max(0, share));
      return planted(
        origin,
        distance > longest ? Vector3.scale(at, longest / distance) : at,
        Vector3.add(
          Vector3.scale(from.thigh, 1 - within),
          Vector3.scale(to.thigh, within),
        ),
        lengths,
        from.thigh,
      );
    };
  }
}
