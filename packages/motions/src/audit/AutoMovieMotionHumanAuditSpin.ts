import { type IAutoMovieResolvedBone, Quaternion } from "@automovie/engine";
import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IAutoMovieMotionHumanAuditMeasure } from "./IAutoMovieMotionHumanAuditMeasure";
import { IAutoMovieMotionHumanAuditMotion } from "./IAutoMovieMotionHumanAuditMotion";

/**
 * Whether every bone turns continuously: the orientation counterpart of the
 * joint-centre continuity audit.
 *
 * A joint centre shows a bone's snap only through the bones below it, so a
 * bone with nothing below it (a fingertip's phalanx, the toes, an eye, the
 * jaw) can flip without any centre moving, and a head or a hand that snaps
 * by a few degrees moves the centres below it by less than the jump limit.
 * This audit reads the orientations themselves.
 *
 * - `spin`: the fastest any bone turns over a grid interval, degrees per
 *   second.
 * - `turn`: the largest turn of any bone that is still there when the
 *   interval around it has been halved `LEVELS` times, degrees. A bone that
 *   turns smoothly turns half as far in half the time, so after ten halvings
 *   a thousandth of its interval's turn is left; a snap keeps its size. An
 *   interval is resolved only where a bone's turn exceeds the mean of its
 *   neighbouring intervals' (of the one neighbour at either end of the
 *   motion) by more than `limit`, so a smooth motion costs no pose beyond
 *   the grid.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the defect the joint centres cannot show, both readings with their units and when an interval is resolved.
 * @evidence contracts/development/implementation.md#principled-implementation Continuity of a rotation path: the angle between two orientations of a continuous path vanishes with the interval, while a discontinuity's does not.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the grid and one bisection per departing bone and interval.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every displayed bone is read, leaf bones included; no bone, action or instant is exempt.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in grid frames and bones; a bisection costs one pose a level, shared by every bone departing in the same interval.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The angle between two orientations is the engine's `Quaternion.angle`; poses inside an interval are resolved once for all its bones.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The poses inside one interval are held while that interval is resolved and dropped with it.
 */
export namespace AutoMovieMotionHumanAuditSpin {
  /** How many times a departing interval is halved. */
  export const LEVELS: number = 10;

  /**
   * The two readings of {@link measure}.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and what its second and bone mean.
   * @evidence contracts/development/design.md#principled-representation A discontinuity and a rate, the two ways a turn is wrong.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, each asserted by the audit's test.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No optional member.
   */
  export interface IResult {
    /** The largest turn left at full resolution, degrees, with the bone and the start of its final interval; zero at `none` when every bone turns continuously at the limit. */
    turn: IAutoMovieMotionHumanAuditMeasure;

    /** The fastest turn over a grid interval, degrees per second, with the bone and the interval's start. */
    spin: IAutoMovieMotionHumanAuditMeasure;
  }

  /**
   * Read how a person's bones turn over the whole motion.
   *
   * @param motion The motion.
   * @param subject The person.
   * @param rate Grid samples per second.
   * @param limit The smallest snap resolved, degrees.
   * @returns The two readings.
   * @throws {Error} When the rate is not positive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input with its unit and the failure.
   * @evidence contracts/development/implementation.md#principled-implementation An interval's turn is compared with the mean of its two neighbours', which a constant angular acceleration leaves equal; what departs is bisected toward the half that turns more.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The grid pass decides, the bisection measures.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A resolved turn below the limit is not reported, so the reading is zero exactly when no snap of that size exists.
   * @evidence contracts/development/implementation.md#efficient-algorithms Grid poses are resolved once; inner poses once per interval.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The grid is `IAutoMovieMotionHumanAuditMotion.grid`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Inner poses live in one interval's map.
   */
  export function measure(
    motion: IAutoMovieMotionHumanAuditMotion,
    subject: string,
    rate: number = 24,
    limit: number = 5,
  ): IResult {
    const times: number[] = IAutoMovieMotionHumanAuditMotion.grid(
      0,
      motion.duration,
      rate,
    );
    const frames: IBones[] = times.map(
      (t: number): IBones => motion.bones(subject, t),
    );
    const result: IResult = {
      turn: { value: 0, seconds: 0, where: "none" },
      spin: { value: 0, seconds: 0, where: "none" },
    };
    const turned = (i: number, bone: AutoMovieHumanoidBone): number =>
      between(frames[i]!, frames[i + 1]!, bone);
    for (let i: number = 0; i + 1 < times.length; i++) {
      const inner: Map<number, IBones> = new Map([
        [times[i]!, frames[i]!],
        [times[i + 1]!, frames[i + 1]!],
      ]);
      const at = (seconds: number): IBones => {
        let bones: IBones | undefined = inner.get(seconds);
        if (bones === undefined) {
          bones = motion.bones(subject, seconds);
          inner.set(seconds, bones);
        }
        return bones;
      };
      for (const bone of frames[i]!.keys()) {
        const now: number = turned(i, bone);
        const spin: number = now / (times[i + 1]! - times[i]!);
        if (spin > result.spin.value)
          result.spin = { value: spin, seconds: times[i]!, where: bone };
        const around: number[] = [];
        if (i > 0) around.push(turned(i - 1, bone));
        if (i + 2 < times.length) around.push(turned(i + 1, bone));
        const usual: number =
          around.length === 0
            ? 0
            : around.reduce((sum: number, v: number): number => sum + v, 0) /
              around.length;
        if (now - usual <= limit) continue;
        let from: number = times[i]!;
        let to: number = times[i + 1]!;
        for (let level: number = 0; level < LEVELS; level++) {
          const middle: number = (from + to) / 2;
          if (
            between(at(from), at(middle), bone) >=
            between(at(middle), at(to), bone)
          )
            to = middle;
          else from = middle;
        }
        const left: number = between(at(from), at(to), bone);
        if (left > limit && left > result.turn.value)
          result.turn = { value: left, seconds: from, where: bone };
      }
    }
    return result;
  }
}

/** A person's displayed bones at an instant. */
type IBones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

/** The angle between one bone's orientations in two instants, degrees. */
const between = (a: IBones, b: IBones, bone: AutoMovieHumanoidBone): number => {
  const first: IAutoMovieResolvedBone | undefined = a.get(bone);
  const second: IAutoMovieResolvedBone | undefined = b.get(bone);
  if (first === undefined || second === undefined)
    throw new Error(`A spin reading lost ${bone} between two instants`);
  return (
    (Quaternion.angle(first.worldRotation, second.worldRotation) * 180) /
    Math.PI
  );
};
