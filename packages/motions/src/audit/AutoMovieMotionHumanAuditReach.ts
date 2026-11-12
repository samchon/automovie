import { type IAutoMovieResolvedBone, Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieMotionHumanAuditMeasure } from "./IAutoMovieMotionHumanAuditMeasure";
import { IAutoMovieMotionHumanAuditMotion } from "./IAutoMovieMotionHumanAuditMotion";

/**
 * Whether a body part gets where its action says and points as its action
 * says, over a stated span of the film.
 *
 * An action's purpose is mostly one of two statements: a point of the body
 * is at a place (a palm on a shoulder, a cup's rim at the mouth, a fist on a
 * target), or an axis of the body points along a direction (a cup held
 * upright, a palm facing a partner, the eyes on a thing). `gap` reads the
 * first as the distance between the point and the place, `tilt` the second
 * as the angle between the axis and the direction. Each reports both ends
 * over the span: `worst` is what a contract that says "throughout" is judged
 * by (a hand that leaves the shoulder mid-hold), `best` what one that says
 * "reaches" is judged by (a hand that never arrives).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two statements, the reading of each and which end judges which wording.
 * @evidence contracts/development/implementation.md#principled-implementation Euclidean distance between two points and the angle between two directions, each read at every instant of the span.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Two readings over one shared span walk.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Both ends of the span are read, and a missing bone or a direction of no length is an error, not a skip.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the span's instants.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The grid is `IAutoMovieMotionHumanAuditMotion.grid`, the axis is turned by the engine's `Quaternion.rotateVector`.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export namespace AutoMovieMotionHumanAuditReach {
  /**
   * A span of the film and its grid.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit.
   * @evidence contracts/development/design.md#principled-representation The window a contract speaks of, in film seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members shared by both readings.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The rate's default is the audit's, stated once.
   */
  export interface ISpan {
    /** Start, film seconds. */
    from: number;

    /** End, film seconds, at least `from`. */
    to: number;

    /** Grid samples per second; 24 by default. */
    rate?: number;
  }

  /**
   * Both ends of a reading over a span.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states which wording it judges.
   * @evidence contracts/development/design.md#principled-representation The maximum and the minimum, with their instants.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, each asserted by the audit's test.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No optional member.
   */
  export interface IResult {
    /** The largest value over the span, with its instant: what "throughout" is judged by. */
    worst: IAutoMovieMotionHumanAuditMeasure;

    /** The smallest value over the span, with its instant: what "reaches" is judged by. */
    best: IAutoMovieMotionHumanAuditMeasure;
  }

  /**
   * How far a point of the body is from a place.
   *
   * @param motion The motion.
   * @param subject The person.
   * @param point The body's point from the displayed bones, world metres.
   * @param place The place at a film second, world metres.
   * @param span The span and its grid.
   * @param where What the reading is named in a finding.
   * @returns The largest and the smallest distance, metres.
   * @throws {Error} When the span is reversed or the rate is not positive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input with its frame and unit.
   * @evidence contracts/development/implementation.md#principled-implementation The distance at each instant of the span.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Delegates the walk to the shared span reader.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tolerance; the caller's limit judges.
   * @evidence contracts/development/implementation.md#efficient-algorithms One pose per instant.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the span walk with `tilt`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function gap(
    motion: IAutoMovieMotionHumanAuditMotion,
    subject: string,
    point: (
      bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    ) => IAutoMovieVector3,
    place: (seconds: number) => IAutoMovieVector3,
    span: ISpan,
    where: string,
  ): IResult {
    return walk(span, where, (t: number): number => {
      const p: IAutoMovieVector3 = point(motion.bones(subject, t));
      const q: IAutoMovieVector3 = place(t);
      return Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
    });
  }

  /**
   * How far an axis of a bone is from a direction.
   *
   * @param motion The motion.
   * @param subject The person.
   * @param bone The bone.
   * @param axis The axis in the bone's own frame; any positive length.
   * @param toward The direction at a film second, world frame; any positive length.
   * @param span The span and its grid.
   * @returns The largest and the smallest angle, degrees in [0, 180], named `<bone> axis`.
   * @throws {Error} When the bone is not displayed, a direction has no length, the span is reversed or the rate is not positive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input with its frame and the result's range.
   * @evidence contracts/development/implementation.md#principled-implementation The axis is turned into the world by the bone's displayed orientation; the angle is `atan2` of the cross and the dot, accurate at both ends of its range.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Delegates the walk to the shared span reader.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A direction of no length throws instead of reading as aligned.
   * @evidence contracts/development/implementation.md#efficient-algorithms One pose per instant.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the engine's `Quaternion.rotateVector`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function tilt(
    motion: IAutoMovieMotionHumanAuditMotion,
    subject: string,
    bone: AutoMovieHumanoidBone,
    axis: IAutoMovieVector3,
    toward: (seconds: number) => IAutoMovieVector3,
    span: ISpan,
  ): IResult {
    return walk(span, `${bone} axis`, (t: number): number => {
      const resolved: IAutoMovieResolvedBone | undefined = motion
        .bones(subject, t)
        .get(bone);
      if (resolved === undefined)
        throw new Error(`A tilt reading needs ${bone} displayed`);
      const a: IAutoMovieVector3 = Quaternion.rotateVector(
        resolved.worldRotation,
        axis,
      );
      const b: IAutoMovieVector3 = toward(t);
      const cross: number = Math.hypot(
        a.y * b.z - a.z * b.y,
        a.z * b.x - a.x * b.z,
        a.x * b.y - a.y * b.x,
      );
      const dot: number = a.x * b.x + a.y * b.y + a.z * b.z;
      if (!(Math.hypot(cross, dot) > 0))
        throw new Error("A tilt reading needs directions of positive length");
      return (Math.atan2(cross, dot) * 180) / Math.PI;
    });
  }
}

/** Both ends of a value over a span's grid. */
const walk = (
  span: AutoMovieMotionHumanAuditReach.ISpan,
  where: string,
  value: (seconds: number) => number,
): AutoMovieMotionHumanAuditReach.IResult => {
  let worst: IAutoMovieMotionHumanAuditMeasure | undefined;
  let best: IAutoMovieMotionHumanAuditMeasure | undefined;
  for (const t of IAutoMovieMotionHumanAuditMotion.grid(
    span.from,
    span.to,
    span.rate ?? 24,
  )) {
    const v: number = value(t);
    if (worst === undefined || v > worst.value)
      worst = { value: v, seconds: t, where };
    if (best === undefined || v < best.value)
      best = { value: v, seconds: t, where };
  }
  return { worst: worst!, best: best! };
};
