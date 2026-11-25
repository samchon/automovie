import { carriedRate, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanWalkFoot,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";
import type { humanFootOffset } from "../posture/humanFootOffset";

/** The foot point a stance rocker turns about. */
type WalkFootPivot = "heel" | "mtp";

/**
 * Prepare a foot in stance on a footprint: heel rocker after its strike, flat,
 * forefoot rocker before its toe-off.
 *
 * In stance a foot rolls on its heel from `STRIKE` toes-up to flat over
 * `HEEL_SHARE` of the stance and, over its last `PUSH_SHARE` (from the heel's
 * rise in terminal stance), on its ball to its push pitch at toe-off
 * (provisional angles inside the ranges of Perry and Burnfield's rockers), the
 * toes extending at the ball by the same angle so they stay flat on the floor.
 * The forefoot rocker starts at rest and ends still turning (`LEAVE`), the rate
 * the swing then carries on from (`walkFoot.prepareSwing`). Both pivots are
 * prepared here, so a read evaluates one minimum-jerk share and one pivot.
 *
 * @param body The foot's fixed body.
 * @param side The foot.
 * @param flat The footprint.
 * @param heading Its fixed heading, degrees.
 * @param strike Its strike, seconds, or `-Infinity` for the opening stance,
 *   which stands from the take's start at second 0.
 * @param toeOff Its toe-off, seconds, or `Infinity` for the closing stance.
 * @param push Its toe-off pitch, degrees, negative toes down.
 * @param typical The gait's cruising stance, seconds, from a heel strike to the
 *   same foot's toe-off: the length the rockers of an opening or closing
 *   stance, which has only one of the two ends, take their shares of.
 * @param raised How far the heel is held off the floor through the stance,
 *   degrees about the toes' joint; 0 when absent, a flat foot that lands heel
 *   first. A raised foot lands on its ball with no heel rocker; the opening
 *   stance rises to it and the closing stance settles from it over `RISE`
 *   seconds.
 * @param backward Whether the stance is a backward step's: the forward stance
 *   played backward, the foot landing on its ball pitched toes-down and
 *   settling flat over the forefoot rocker's share, and leaving rolled toes-up
 *   about its heel over the heel rocker's share (provisional: the time reversal
 *   backward walking is described as, not read from a measurement of its
 *   rockers). False when absent.
 * @returns The planted foot at each second.
 */
export function walkFootStance(
  body: humanFootOffset.IBody,
  side: AutoMovieHumanSide,
  flat: IAutoMovieMotionHumanFoot.IPlacement,
  heading: number,
  strike: number,
  toeOff: number,
  push: number,
  typical: number,
  raised: number = 0,
  backward: boolean = false,
): (seconds: number) => IAutoMovieMotionHumanWalkFoot.IFoot {
  const struck: boolean = strike > -Infinity;
  const leaves: boolean = toeOff < Infinity;
  const length: number = struck && leaves ? toeOff - strike : typical;
  const settle: number = walkFootStance.PUSH_SHARE * length;

  // An opening stance stands from the take's start, its second 0, where the
  // foot is the entry's: no rocker of it begins before then, so a first
  // toe-off sooner than its share of the typical stance rolls the foot over
  // what is left of it.
  const begun: number = struck ? strike : 0;
  const rise: number = leaves
    ? Math.max(begun, toeOff - walkFootStance.PUSH_SHARE * length)
    : Infinity;
  const settled: number = strike + settle;
  const heelSpan: number = walkFootStance.HEEL_SHARE * length;
  const heelEnd: number = strike + heelSpan;
  const heelStart: number = Math.max(begun, toeOff - heelSpan);
  const pushSpan: number = toeOff - rise;
  const level: IAutoMovieQuaternion = HumanFoot.rotation(heading, 0);
  const pivotAbout = (
    about: WalkFootPivot,
  ): ReturnType<typeof HumanFoot.preparePivot> =>
    HumanFoot.preparePivot(
      body,
      side,
      about,
      HumanFoot.point(body, side, about, flat),
      heading,
    );
  const pivots: Record<
    WalkFootPivot,
    ReturnType<typeof HumanFoot.preparePivot>
  > = { heel: pivotAbout("heel"), mtp: pivotAbout("mtp") };
  const flatFoot = (): IAutoMovieMotionHumanWalkFoot.IFoot => ({
    placement: { ankle: flat.ankle, rotation: { ...level } },
    toes: 0,
  });
  if (backward && !(raised > 0))
    return (t: number): IAutoMovieMotionHumanWalkFoot.IFoot => {
      // The forward rockers in reverse: down from the ball after the strike,
      // up about the heel before the toe-off.
      if (struck && t < settled) {
        const degrees: number =
          push * (1 - minimumJerk.share((t - strike) / settle));
        return { placement: pivots.mtp(degrees), toes: -degrees };
      }
      if (leaves && t > heelStart) {
        const degrees: number =
          walkFootStance.STRIKE *
          minimumJerk.share((t - heelStart) / (toeOff - heelStart));
        return { placement: pivots.heel(degrees), toes: 0 };
      }
      return flatFoot();
    };

  // A closing stance of a gait on the balls of the feet lands as a walking
  // foot does, heel first and rolled flat (the reader below): it bears a body
  // coming to stand, whose extrapolated centre of mass must lie inside the
  // feet's whole base as the foot takes the weight (Hof, Gazendam and Sinke
  // 2005), and a heel still raised would leave that base to the forefoot.
  if (raised > 0 && !(struck && !leaves))
    return (t: number): IAutoMovieMotionHumanWalkFoot.IFoot => {
      // On the ball throughout: the heel's height, eased up from a flat start,
      // and the forefoot rocker's pitch where it is steeper.
      const held: number =
        raised *
        (struck ? 1 : minimumJerk.share(t / walkFootStance.RISE)) *
        (leaves ? 1 : 0);
      const degrees: number = Math.min(
        -held,
        t > rise ? push * minimumJerk.share((t - rise) / pushSpan) : 0,
      );
      return { placement: pivots.mtp(degrees), toes: -degrees };
    };
  return (t: number): IAutoMovieMotionHumanWalkFoot.IFoot => {
    if (struck && t < heelEnd) {
      const degrees: number =
        walkFootStance.STRIKE *
        (1 - minimumJerk.share((t - strike) / heelSpan));
      return { placement: pivots.heel(degrees), toes: 0 };
    }
    if (leaves && t > rise) {
      const u: number = (t - rise) / pushSpan;
      const degrees: number =
        push *
        (minimumJerk.share(u) - walkFootStance.LEAVE * carriedRate(1, 1 - u));
      return { placement: pivots.mtp(degrees), toes: -degrees };
    }
    return flatFoot();
  };
}

/** The stance rockers' angles, shares and rates. */
export namespace walkFootStance {
  /**
   * The pitch a foot strikes the floor with, degrees toes-up (provisional,
   * inside Perry and Burnfield's heel rocker).
   */
  export const STRIKE: number = 15;

  /**
   * Seconds a walk on the balls of the feet takes to raise the heels from a
   * flat start and to set them down at a flat stop (provisional).
   */
  export const RISE: number = 0.3;

  /**
   * The rate the forefoot rocker ends with, in push pitches per rocker duration
   * (provisional): the foot is still plantarflexing when the toes leave the
   * floor (Perry and Burnfield), and at 2 the minimum-jerk rise with the
   * engine's `carriedRate` term reversed is exactly `2u³ − u⁴`, monotonic and
   * ending with no acceleration.
   */
  export const LEAVE: number = 2;

  /**
   * The share of a stance its heel rocker takes (provisional; loading response
   * is the first 10 to 12 % of the cycle, Perry and Burnfield).
   */
  export const HEEL_SHARE: number = 0.12;

  /**
   * The share of a stance the forefoot rocker takes, from the heel's rise to
   * toe-off: in Perry's phases the heel rises as terminal stance begins, at 30
   * % of the gait cycle, and the toes leave at 60 %, the end of pre-swing, so
   * the rocker takes `(60 - 30) / 60` of the stance (Perry and Burnfield, Gait
   * Analysis, phases of gait, read through Perry-based terminology summaries).
   */
  export const PUSH_SHARE: number = (60 - 30) / 60;
}
