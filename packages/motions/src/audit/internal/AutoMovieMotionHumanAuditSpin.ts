import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanAuditSpin,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditMotion as HumanAuditMotion } from "./AutoMovieMotionHumanAuditMotion";

/*
 * Whether every bone turns continuously: the orientation counterpart of the
 * joint-centre continuity audit.
 *
 * A joint centre shows a bone's snap only through the bones below it, so a bone
 * with nothing below it (a fingertip's phalanx, the toes, an eye, the jaw) can
 * flip without any centre moving, and a head or a hand that snaps by a few
 * degrees moves the centres below it by less than the jump limit. This audit
 * reads the orientations themselves.
 *
 * - `spin`: the fastest any bone turns over a grid interval, degrees per second.
 * - `turn`: the largest turn of any bone that is still there when the interval
 *   around it has been halved `LEVELS` times, degrees. A bone that turns
 *   smoothly turns half as far in half the time, so after ten halvings a
 *   thousandth of its interval's turn is left; a snap keeps its size. An
 *   interval is resolved only where a bone's turn exceeds the mean of its
 *   neighbouring intervals' (of the one neighbour at either end of the motion)
 *   by more than `limit`, so a smooth motion costs no pose beyond the grid. A
 *   bisection stops once it follows a smooth turn: the larger half's excess
 *   over half its interval's turn, which a smooth turn's angular acceleration
 *   makes fall fourfold a halving while a snap keeps about half its size, is
 *   below half of `limit` and has fallen at least twofold since the level above
 *   (a Richardson test: Richardson 1911, Phil Trans R Soc A 210:307, an order-p
 *   error falls 2^p-fold a halving and a non-smooth path breaks that ratio), so
 *   a fast smooth spin costs two poses, not ten.
 */
export namespace AutoMovieMotionHumanAuditSpin {
  /*
   * How many times a departing interval is halved.
   */
  export const LEVELS: number = 10;

  /*
   * The smallest snap measure resolves by default, degrees: an
   * interval's turn must exceed its neighbours' mean by more than this before
   * it is halved, and `AutoMovieMotionHumanVerdicts` bounds the resolved `turn` by it.
   */
  export const SNAP: number = 5;

  /*
   * Read how a person's bones turn over the whole motion.
   * Parameter motion: The motion.
   * Parameter subject: The person.
   * Parameter rate: Grid samples per second.
   * Parameter limit: The smallest snap resolved, degrees.
   * Returns: The two readings.
   * When the rate is not positive.
   */
  export function measure(
    motion: IAutoMovieMotionHumanAuditMotion,
    subject: string,
    rate: number = 24,
    limit: number = SNAP,
  ): IAutoMovieMotionHumanAuditSpin.IResult {
    const times: number[] = HumanAuditMotion.grid(0, motion.duration, rate);
    const frames: IBones[] = times.map(
      (t: number): IBones => motion.bones(subject, t),
    );
    const result: IAutoMovieMotionHumanAuditSpin.IResult = {
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

        // The larger half's excess over half the interval's turn: a smooth
        // turn's is its angular acceleration's, which falls fourfold a
        // halving, while a snap of `s` keeps about half of `s` in the half
        // that holds it. A bisection whose excess is below half the limit and
        // has fallen at least twofold since the level above (the geometric
        // mean of a smooth turn's 4 and a snap's 1) follows a smooth turn,
        // and stops: the Richardson test.
        let whole: number = now;
        let excess: number | undefined;
        let smooth: boolean = false;
        for (let level: number = 0; level < LEVELS; level++) {
          const middle: number = (from + to) / 2;
          const early: number = between(at(from), at(middle), bone);
          const late: number = between(at(middle), at(to), bone);
          const larger: number = Math.max(early, late);
          if (early >= late) to = middle;
          else from = middle;
          const surplus: number = larger - whole / 2;
          if (
            excess !== undefined &&
            surplus < limit / 2 &&
            surplus <= excess / RICHARDSON
          ) {
            smooth = true;
            break;
          }
          excess = surplus;
          whole = larger;
        }
        if (smooth) continue;
        const left: number = between(at(from), at(to), bone);
        if (left > limit && left > result.turn.value)
          result.turn = { value: left, seconds: from, where: bone };
      }
    }
    return result;
  }
}

/*
 * A person's displayed bones at an instant.
 */
type IBones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

/*
 * The fall of a bisection's excess, from one level to the next, that marks a
 * smooth turn: 2, the geometric mean of a smooth turn's fourfold fall and a
 * snap's none.
 */
const RICHARDSON: number = 2;

/*
 * The angle between one bone's orientations in two instants, degrees.
 */
const between = (a: IBones, b: IBones, bone: AutoMovieHumanoidBone): number => {
  const first: IAutoMovieResolvedBone | undefined = a.get(bone);
  const second: IAutoMovieResolvedBone | undefined = b.get(bone);
  if (first === undefined || second === undefined)
    throw new Error(`A spin reading lost ${bone} between two instants`);
  return (
    (AutoMovieEngineQuaternion.angle(first.worldRotation, second.worldRotation) * 180) /
    Math.PI
  );
};
