import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditMeasure,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanAuditReach,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditMotion as HumanAuditMotion } from "./AutoMovieMotionHumanAuditMotion";

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
 */
export namespace AutoMovieMotionHumanAuditReach {
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
   */
  export function gap(
    motion: IAutoMovieMotionHumanAuditMotion,
    subject: string,
    point: (
      bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    ) => IAutoMovieVector3,
    place: (seconds: number) => IAutoMovieVector3,
    span: IAutoMovieMotionHumanAuditReach.ISpan,
    where: string,
  ): IAutoMovieMotionHumanAuditReach.IResult {
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
   */
  export function tilt(
    motion: IAutoMovieMotionHumanAuditMotion,
    subject: string,
    bone: AutoMovieHumanoidBone,
    axis: IAutoMovieVector3,
    toward: (seconds: number) => IAutoMovieVector3,
    span: IAutoMovieMotionHumanAuditReach.ISpan,
  ): IAutoMovieMotionHumanAuditReach.IResult {
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
  span: IAutoMovieMotionHumanAuditReach.ISpan,
  where: string,
  value: (seconds: number) => number,
): IAutoMovieMotionHumanAuditReach.IResult => {
  let worst: IAutoMovieMotionHumanAuditMeasure | undefined;
  let best: IAutoMovieMotionHumanAuditMeasure | undefined;
  for (const t of HumanAuditMotion.grid(span.from, span.to, span.rate ?? 24)) {
    const v: number = value(t);
    if (worst === undefined || v > worst.value)
      worst = { value: v, seconds: t, where };
    if (best === undefined || v < best.value)
      best = { value: v, seconds: t, where };
  }
  return { worst: worst!, best: best! };
};
