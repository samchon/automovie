import {
  Vector3,
  carriedRate,
  minimumJerk,
  wrapDegrees,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanWalkFoot,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditContact } from "../audit/AutoMovieMotionHumanAuditContact";
import { HumanFoot } from "../posture/HumanFoot";
import { walkFootTakeoff } from "./walkFootTakeoff";

/** The record of `ISwingRates`'s site. */
type ISwingRates = { pitch: number; toes: number };

/** The alternatives of `PrepareStanceRockAbout2`'s site. */
type PrepareStanceRockAbout2 = "heel" | "mtp";

/** The alternatives of `PrepareStanceRockAbout`'s site. */
type PrepareStanceRockAbout = "heel" | "mtp";

/** The alternatives of `PivotsEntryItem`'s site. */
type PivotsEntryItem = "heel" | "mtp";

/**
 * One foot of a stepping gait at an instant: the rockers of its stance on a
 * footprint and its swing between two reached stances.
 *
 * In stance a foot rolls on its heel from 15° toes-up to flat over 12 % of the
 * stance and, over its last `PUSH_SHARE` (half, from the heel's rise in
 * terminal stance), on its ball to its push pitch at toe-off (provisional
 * angles inside the ranges of Perry and Burnfield's rockers), the toes
 * extending at the ball by the same angle so they stay flat on the floor. The
 * forefoot rocker starts at rest and ends still turning (`LEAVE`), the rate the
 * swing then carries on from. In swing the ankle leaves the placement and the
 * velocity its stance ended with and arrives at rest on the placement its next
 * stance begins with, on a quintic Hermite curve (the minimum-jerk profile of
 * Flash and Hogan 1985 plus the engine's `carriedRate` term for the initial
 * velocity), lifted at mid-swing on a raised-cosine bump, `sin²(π u)`, whose
 * slope is zero at both ends, so the lift adds no velocity at toe-off and the
 * foot meets the floor at rest (the heel's vertical velocity at contact is near
 * zero, Winter 1992), and raised further wherever the toe or heel would come
 * nearer the floor than the lift itself, up to `CLEARANCE`, or within
 * `CLEARANCE` of it at mid-swing. The travel, the turn and the descent of the
 * placements end early, at the share of the swing where the lift has fallen to
 * the contact height of the floor (`AutoMovieMotionHumanAuditContact.HEIGHT`,
 * half the minimum toe clearance): in terminal swing the foot comes to rest
 * over its landing and only then sets down, the heel's horizontal velocity
 * falling through terminal swing as it descends (Winter 1992), so no sole is on
 * the floor while it still travels. The toes relax over the first half and take
 * the landing's flexion over the second. At ordinary walking toe-off, the
 * lowest sole point keeps its horizontal anchor while the foot lifts to the
 * contact height. The original swing path resumes smoothly over the same
 * interval length, following the local placement correction of Kovar, Schreiner
 * and Gleicher (2002).
 */
export namespace walkFoot {
  /** What a stance ends or begins with, which a swing joins. */
  export interface IEnd {
    /** The ankle, world metres. */
    ankle: IAutoMovieVector3;

    /** The foot's world rotation. */
    rotation: IAutoMovieQuaternion;

    /** The toes' flexion, degrees. */
    toes: number;
  }

  /**
   * Prepare a foot in stance on a footprint: heel rocker after its strike,
   * flat, forefoot rocker before its toe-off.
   *
   * @param body The foot's fixed body.
   * @param side The foot.
   * @param flat The footprint.
   * @param heading Its fixed heading, degrees.
   * @param strike Its strike, seconds, or `-Infinity` for the opening stance,
   *   which stands from the take's start at second 0.
   * @param toeOff Its toe-off, seconds, or `Infinity` for the closing stance.
   * @param push Its toe-off pitch, degrees, negative toes down.
   * @param typical The gait's cruising stance, seconds, from a heel strike to
   *   the same foot's toe-off: the length the rockers of an opening or closing
   *   stance, which has only one of the two ends, take their shares of.
   * @param raised How far the heel is held off the floor through the stance,
   *   degrees about the toes' joint; 0 when absent, a flat foot that lands heel
   *   first. A raised foot lands on its ball with no heel rocker; the opening
   *   stance rises to it and the closing stance settles from it over `RISE`
   *   seconds.
   * @param backward Whether the stance is a backward step's: the forward stance
   *   played backward, the foot landing on its ball pitched toes-down and
   *   settling flat over the forefoot rocker's share, and leaving rolled
   *   toes-up about its heel over the heel rocker's share (provisional: the
   *   time reversal backward walking is described as, not read from a
   *   measurement of its rockers). False when absent.
   * @returns The planted foot at each second.
   */
  export function prepareStance(
    body: IAutoMovieMotionHumanBody,
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
    const struck: boolean = Number.isFinite(strike);
    const leaves: boolean = Number.isFinite(toeOff);
    const length: number = struck && leaves ? toeOff - strike : typical;
    const settle: number = PUSH_SHARE * length;

    // An opening stance stands from the take's start, its second 0, where
    // the foot is the entry's: no rocker of it begins before then, so a
    // first toe-off sooner than its share of the typical stance rolls the
    // foot over what is left of it.
    const begun: number = struck ? strike : 0;
    const rise: number = leaves
      ? Math.max(begun, toeOff - PUSH_SHARE * length)
      : Infinity;
    const settled: number = strike + settle;
    const heelSpan: number = HEEL_SHARE * length;
    const heelEnd: number = strike + heelSpan;
    const heelStart: number = Math.max(begun, toeOff - heelSpan);
    const pushSpan: number = toeOff - rise;
    const level: IAutoMovieQuaternion = HumanFoot.rotation(heading, 0);
    const pivots: Partial<
      Record<PivotsEntryItem, ReturnType<typeof HumanFoot.preparePivot>>
    > = {};
    const rock: (
      degrees: number,
      about: PrepareStanceRockAbout,
    ) => IAutoMovieMotionHumanFoot.IPlacement = (
      degrees: number,
      about: PrepareStanceRockAbout2,
    ): IAutoMovieMotionHumanFoot.IPlacement =>
      (pivots[about] ??= HumanFoot.preparePivot(
        body,
        side,
        about,
        HumanFoot.point(body, side, about, flat),
        heading,
      ))(degrees);
    if (backward && !(raised > 0))
      return (t: number): IAutoMovieMotionHumanWalkFoot.IFoot => {
        // The forward rockers in reverse: down from the ball after the strike,
        // up about the heel before the toe-off.
        if (struck && t < settled) {
          const degrees: number =
            push * (1 - minimumJerk.share((t - strike) / settle));
          return {
            placement: rock(degrees, "mtp"),
            toes: -degrees,
          };
        }
        if (leaves && t > heelStart) {
          const degrees: number =
            STRIKE * minimumJerk.share((t - heelStart) / (toeOff - heelStart));
          return {
            placement: rock(degrees, "heel"),
            toes: 0,
          };
        }
        return {
          placement: { ankle: flat.ankle, rotation: { ...level } },
          toes: 0,
        };
      };
    // A closing stance of a gait on the balls of the feet lands as a walking
    // foot does, heel first and rolled flat (the reader below): it bears a
    // body coming to stand, whose extrapolated centre of mass must lie
    // inside the feet's whole base as the foot takes the weight (Hof,
    // Gazendam and Sinke 2005), and a heel still raised would leave that base
    // to the forefoot.
    if (raised > 0 && !(struck && !leaves))
      return (t: number): IAutoMovieMotionHumanWalkFoot.IFoot => {
        // On the ball throughout: the heel's height, eased up from a flat
        // start, and the forefoot rocker's pitch where it is steeper.
        const held: number =
          raised *
          (struck ? 1 : minimumJerk.share(t / RISE)) *
          (leaves ? 1 : 0);
        const degrees: number = Math.min(
          -held,
          t > rise ? push * minimumJerk.share((t - rise) / pushSpan) : 0,
        );
        return {
          placement: rock(degrees, "mtp"),
          toes: -degrees,
        };
      };
    return (t: number): IAutoMovieMotionHumanWalkFoot.IFoot => {
      if (struck && t < heelEnd) {
        const degrees: number =
          STRIKE * (1 - minimumJerk.share((t - strike) / heelSpan));
        return {
          placement: rock(degrees, "heel"),
          toes: 0,
        };
      }
      if (leaves) {
        if (t > rise) {
          const u: number = (t - rise) / pushSpan;
          const degrees: number =
            push * (minimumJerk.share(u) - LEAVE * carriedRate(1, 1 - u));
          return {
            placement: rock(degrees, "mtp"),
            toes: -degrees,
          };
        }
      }
      return {
        placement: { ankle: flat.ankle, rotation: { ...level } },
        toes: 0,
      };
    };
  }

  /**
   * The fixed inputs of a swing between the stance it left and the stance it
   * lands in.
   */
  export interface ISwing {
    /** The stance's end the foot leaves. */
    from: IEnd;

    /** The ankle's velocity as it leaves, world metres per second. */
    velocity: IAutoMovieVector3;

    /**
     * The rates its pitch and its toes leave with, degrees per second, carried
     * over the first half of the swing by the engine's `carriedRate`; none when
     * absent.
     */
    rates?: ISwingRates;

    /** The stance's start the foot lands on. */
    to: IEnd;

    /** The swing's duration, seconds. */
    seconds: number;

    /** The mid-swing lift, hip heights. */
    lift: number;

    /**
     * The least clearance of the toe and heel at mid-swing, metres; `CLEARANCE`
     * when absent.
     */
    clearance?: number;

    /**
     * How far the ankle bows out horizontally at the middle of its travel,
     * world metres, on the lift's raised-cosine profile over the travel's
     * progress: a swing passing a stance foot on a curve keeps its width
     * (`walkSwing`); none when absent.
     */
    bow?: IAutoMovieVector3;

    /** Whether the leg is kept straight (`STIFF`, `LEVEL`); false when absent. */
    stiff?: boolean;

    /**
     * Whether horizontal travel ends before touchdown. An explicitly settling
     * heel-first swing retains a downward impact speed.
     */
    settles?: boolean;
  }

  /**
   * Prepare a swing whose body, endpoint stances and initial rates are fixed.
   * The returned reader accepts its share in any order and owns no sample
   * cache.
   *
   * @param body The body whose hip height scales the authored lift.
   * @param side The swinging foot.
   * @param props The swing's fixed inputs.
   * @returns The swinging foot at each share of the swing.
   */
  export function prepareSwing(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    props: ISwing,
  ): (share: number) => IAutoMovieMotionHumanWalkFoot.IFoot {
    const stiff: boolean = props.stiff === true;

    // Terminal swing: the travel ends where the lift, `sin²(π u)` of its
    // height, has fallen to the floor's contact height, and the foot then
    // sets down at rest over its landing.
    const height: number =
      (stiff ? STIFF : 1) * props.lift * body.measure.hipHeight;
    const settle: number =
      props.settles === false ||
      height <= AutoMovieMotionHumanAuditContact.HEIGHT
        ? 0
        : Math.asin(
            Math.sqrt(AutoMovieMotionHumanAuditContact.HEIGHT / height),
          ) / Math.PI;
    const fromAngles: ReturnType<typeof HumanFoot.headingPitch> =
      HumanFoot.headingPitch(props.from.rotation);
    const toAngles: ReturnType<typeof HumanFoot.headingPitch> =
      HumanFoot.headingPitch(props.to.rotation);
    const leaving: number = fromAngles.heading;
    const headingDelta: number = wrapDegrees(toAngles.heading - leaving);
    const left: number = fromAngles.pitch;
    const pitchDelta: number = toAngles.pitch - left;
    const rolled: number = HumanFoot.roll(props.from.rotation);
    const rollDelta: number = HumanFoot.roll(props.to.rotation) - rolled;
    const heel: ReturnType<typeof HumanFoot.prepareHeight> =
      HumanFoot.prepareHeight(body, side, "heel");
    const toe: ReturnType<typeof HumanFoot.prepareHeight.articulated> =
      HumanFoot.prepareHeight.articulated(body, side, "toe");
    const delta: IAutoMovieVector3 = Vector3.subtract(
      props.to.ankle,
      props.from.ankle,
    );
    // A heel-first walking touchdown accepts a finite normal impact velocity
    // (Baines, Schwab and van Soest 2018, doi:10.1371/journal.pone.0197428). From the swing apex the
    // lowest-degree descent matching its height and zero rate is quadratic.
    // Its inverse gives the terminal share below the contact height.
    const heelImpact: boolean =
      props.settles === true && toAngles.pitch > 0 && !stiff;
    const landing: number =
      heelImpact && settle > 0
        ? (1 -
            Math.sqrt(1 - AutoMovieMotionHumanAuditContact.HEIGHT / height)) /
          2
        : settle;
    const carriedSeconds: number = (1 - landing) * props.seconds;
    const turnSeconds: number = (stiff ? LEVEL : 0.5) * props.seconds;
    const levelSeconds: number = LEVEL * props.seconds;
    const departure: walkFootTakeoff.IDeparture | undefined =
      settle > 0 ? walkFootTakeoff(body, side, props.from) : undefined;
    return (share: number): IAutoMovieMotionHumanWalkFoot.IFoot => {
      const u: number = Math.min(1, Math.max(0, share));
      const travel: number = Math.min(1, u / (1 - landing));
      const s: number = minimumJerk.share(travel);
      const carried: number = carriedRate(
        carriedSeconds,
        travel * carriedSeconds,
      );
      const bump: number =
        heelImpact && u > 0.5
          ? 1 - (2 * u - 1) ** 2
          : Math.sin(Math.PI * u) ** 2;

      // A leg kept straight cannot carry its heel's rise through the swing: its foot is down at its landing height and pitch by `LEVEL` of the swing, and is lifted by `STIFF` of the gait's lift.
      const level: number = stiff
        ? minimumJerk.share(Math.min(1, u / LEVEL))
        : s;
      const rising: number = stiff
        ? carriedRate(levelSeconds, u * props.seconds)
        : carried;
      const a: IAutoMovieVector3 = props.from.ankle;
      const bowed: number = Math.sin(Math.PI * s) ** 2;
      const ankle: IAutoMovieVector3 = {
        x:
          a.x +
          delta.x * s +
          props.velocity.x * carried +
          (props.bow?.x ?? 0) * bowed,
        y: a.y + delta.y * level + props.velocity.y * rising + height * bump,
        z:
          a.z +
          delta.z * s +
          props.velocity.z * carried +
          (props.bow?.z ?? 0) * bowed,
      };
      const heading: number = leaving + headingDelta * s;
      const turning: number = carriedRate(turnSeconds, u * props.seconds);
      const toes: number =
        props.from.toes * (1 - minimumJerk.share(Math.min(1, 2 * u))) +
        props.to.toes * minimumJerk.share(Math.max(0, 2 * u - 1)) +
        (props.rates?.toes ?? 0) * turning;

      // A foot that leaves or lands on its edge rolls between the two as its
      // pitch does.
      const placement: IAutoMovieMotionHumanFoot.IPlacement = {
        ankle,
        rotation: HumanFoot.rotation(
          heading,
          left + pitchDelta * level + (props.rates?.pitch ?? 0) * turning,
          rolled + rollDelta * level,
        ),
      };
      const low: number = Math.min(toe(toes)(placement), heel(placement));

      // The sole rises at least with the lift until the least clearance
      // takes over, then keeps that clearance through mid-swing: the toe,
      // which the pitch and the relaxing toes turn down after toe-off, stays
      // over the floor's contact height from the share the travel is
      // released at (`settle`, where the lift reaches that height), so no
      // sole is on the floor while it travels.
      const least: number = props.clearance ?? CLEARANCE;
      const clearance: number = Math.max(
        least * bump,
        Math.min(height * bump, least),
      );
      if (low < clearance) ankle.y += clearance - low;
      if (departure !== undefined && u < settle + settle) {
        const sole: IAutoMovieVector3 = HumanFoot.point(
          body,
          side,
          departure.socket,
          placement,
          toes,
        );
        const released: number = minimumJerk.share(
          Math.max(0, (u - settle) / settle),
        );
        ankle.x += (departure.point.x - sole.x) * (1 - released);
        ankle.z += (departure.point.z - sole.z) * (1 - released);
      }
      return { placement, toes };
    };
  }

  /**
   * The pitch a foot strikes the floor with, degrees toes-up (provisional,
   * inside Perry and Burnfield's heel rocker).
   */
  export const STRIKE: number = 15;

  /**
   * The share of a gait's swing lift a leg kept straight is given: with no knee
   * to fold, its foot clears the floor by little (provisional; the hip hike and
   * the outward arc that real stiff-knee walkers add are not modelled).
   */
  export const STIFF: number = 0.3;

  /**
   * The share of its swing by which a straight leg's foot is down at its
   * landing height and pitch (provisional): a knee that does not fold cannot
   * hold the heel's rise of toe-off over the floor, so the ankle dorsiflexes
   * and the foot passes low under the hip.
   */
  export const LEVEL: number = 0.4;

  /**
   * The steepest toe-off pitch of a leg kept straight, degrees toes-down
   * (provisional): the foot leaves nearly flat, where a folding knee lets it
   * leave at about 55.
   */
  export const STIFF_PUSH: number = 15;

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
  const LEAVE: number = 2;

  /**
   * The share of a stance its heel rocker takes (provisional; loading response
   * is the first 10 to 12 % of the cycle, Perry and Burnfield).
   */
  const HEEL_SHARE: number = 0.12;

  /**
   * The share of a stance the forefoot rocker takes, from the heel's rise to
   * toe-off: in Perry's phases the heel rises as terminal stance begins, at 30
   * % of the gait cycle, and the toes leave at 60 %, the end of pre-swing, so
   * the rocker takes `(60 - 30) / 60` of the stance (Perry and Burnfield, Gait
   * Analysis, phases of gait, read through Perry-based terminology summaries).
   */
  const PUSH_SHARE: number = (60 - 30) / 60;

  /**
   * The least clearance of a swinging foot's toe and heel at mid-swing, metres:
   * the mean minimum toe clearance of level walking, 15.0 mm (SD 4.0 mm, 121
   * adults of 20 to 79 years on a treadmill; 15.1 +- 0.5 mm SEM for the 41 aged
   * 20 to 39), the second metatarsal head's lowest height in swing over its
   * height in stance (Killeen et al. 2017, Sci Rep 7:1922, read in its PMC full
   * text, PMC5432520). Winter 1992's 1.29 cm (Phys Ther 72:45) agrees; only its
   * abstract was reachable.
   */
  export const CLEARANCE: number = 0.015;
}
