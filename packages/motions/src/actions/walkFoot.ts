import { Vector3, carriedRate, minimumJerk, wrapDegrees } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditContact } from "../audit/AutoMovieMotionHumanAuditContact";
import type { IHumanBody } from "../body/IHumanBody";
import { HumanFoot } from "../posture/HumanFoot";

/**
 * One foot of a stepping gait at an instant: the rockers of its stance on a
 * footprint and its swing between two reached stances.
 *
 * In stance a foot rolls on its heel from 15° toes-up to flat over 12 % of
 * the stance and, from 60 % of it, on its ball to its push pitch at toe-off
 * (provisional angles inside the ranges of Perry and Burnfield's rockers), the
 * toes extending at the ball by the same angle so they stay flat on the floor.
 * The forefoot rocker starts at rest and ends still turning (`LEAVE`), the
 * rate the swing then carries on from.
 * In swing the ankle leaves the placement and the velocity its stance ended
 * with and arrives at rest on the placement its next stance begins with, on a
 * quintic Hermite curve (the minimum-jerk profile of Flash and Hogan 1985 plus
 * the engine's `carriedRate` term for the initial velocity), lifted at
 * mid-swing on a raised-cosine bump, `sin²(π u)`, whose slope is zero at both
 * ends, so the lift adds no velocity at toe-off and the foot meets the floor
 * at rest (the heel's vertical velocity at contact is near zero, Winter
 * 1992), and raised
 * further wherever the toe or heel would come within `CLEARANCE` of the floor. The
 * travel, the turn and the descent of the placements end early, at the share
 * of the swing where the lift has fallen to the contact height of the floor
 * (`AutoMovieMotionHumanAuditContact.HEIGHT`, half the minimum toe
 * clearance): in terminal swing the foot comes to rest over its landing and
 * only then sets down, the heel's horizontal velocity falling through
 * terminal swing as it descends (Winter 1992), so no sole is on the floor
 * while it still travels. The toes relax over the first half and take the
 * landing's flexion over the second.
 */
export namespace walkFoot {
  /** A foot's placement and toes at an instant. */
  export interface IFoot {
    /** Its placement. */
    placement: HumanFoot.IPlacement;

    /** The toes' flexion from the foot, degrees, positive lifting them. */
    toes: number;
  }

  /**
   * A foot as its schedule has it at an instant: the stance it stands in, or
   * for a swinging foot the stance that claims the pelvis, the one it left at
   * its toe-off over the first half of the swing and the one it lands in at
   * its heel strike over the second.
   */
  export interface IScheduled extends IFoot {
    /** A swinging foot's share of its swing and the swing's two ends, seconds. */
    swing?: { u: number; off: number; on: number };
  }

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
   * A flat footprint pitched about its heel or ball.
   *
   * @param body The body.
   * @param side The foot.
   * @param flat The flat footprint.
   * @param heading The foot's heading, degrees.
   * @param degrees The pitch, positive toes up.
   * @param about The point that stays where the flat footprint has it.
   * @returns The pitched placement.
   */
  export function rocked(
    body: IHumanBody,
    side: "left" | "right",
    flat: HumanFoot.IPlacement,
    heading: number,
    degrees: number,
    about: "heel" | "mtp",
  ): HumanFoot.IPlacement {
    return HumanFoot.pivot(
      body,
      side,
      about,
      HumanFoot.point(body, side, about, flat),
      heading,
      degrees,
    );
  }

  /**
   * A foot in stance: heel rocker after its strike, flat, forefoot rocker
   * before its toe-off.
   *
   * @param body The body.
   * @param side The foot.
   * @param flat Its flat footprint.
   * @param heading Its heading, degrees.
   * @param strike The stance's heel strike, seconds; `-Infinity` for the starting stance.
   * @param toeOff The stance's toe-off, seconds; `Infinity` for the closing stance.
   * @param t The instant, seconds.
   * @param push The pitch at toe-off, degrees, negative.
   * @param raised How far the heel is held off the floor through the stance, degrees about the toes' joint; 0 for a flat foot that lands heel first. A raised foot lands on its ball with no heel rocker; the starting stance rises to it and the closing stance settles from it over `RISE` seconds.
   * @param backward Whether the stance is a backward step's: the forward stance played backward, the foot landing on its ball pitched toes-down and settling flat over the forefoot rocker's share, and leaving rolled toes-up about its heel over the heel rocker's share (provisional: the time reversal backward walking is described as, not read from a measurement of its rockers). False when absent.
   * @returns The planted foot.
   */
  export function stance(
    body: IHumanBody,
    side: "left" | "right",
    flat: HumanFoot.IPlacement,
    heading: number,
    strike: number,
    toeOff: number,
    t: number,
    push: number,
    raised: number = 0,
    backward: boolean = false,
  ): IFoot {
    return prepareStance(body, side, flat, heading, strike, toeOff, push, raised, backward)(t);
  }

  /**
   * Prepare a footprint's fixed stance timing and rigid rocker pivots.
   *
   * @param body The foot's fixed body.
   * @param side The foot.
   * @param flat The footprint.
   * @param heading Its fixed heading, degrees.
   * @param strike Its strike, seconds, or `-Infinity` for the opening stance.
   * @param toeOff Its toe-off, seconds, or `Infinity` for the closing stance.
   * @param push Its toe-off pitch, degrees, negative toes down.
   * @param raised Its held heel-rise pitch, degrees; zero when absent.
   * @param backward Whether the foot's rockers run backward; false when absent.
   * @returns The same stance as `stance` at each queried second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed footprint/time inputs, angular conventions, defaults and the random-access stance reader.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the original forward, backward and raised-heel rocker formulas, with their fixed interval boundaries and heel/toe-joint pivots prepared outside the time reader.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Fixed temporal terms and lazy rigid pivots precede one selected forward, backward or raised-heel reader, each retaining its existing active rocker decisions.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps strict branch comparisons, every minimum-jerk/carried term, opening/closing stance rules and toe compensation unchanged.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant preparation and evaluation; gait-kind selection and fixed heel/push interval endpoints and denominators leave the time reader. A flat stance copies its fixed rotation, while each rocker contact and yaw/roll prefix is prepared at most once per footprint.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Body, side, footprint, heading, strike/toe-off, push and raised/backward gait values fix this stance; queried seconds are never cached.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One reader retains one flat rotation and at most two rigid-pivot readers until its step plan releases it, with no time history.
   */
  export function prepareStance(
    body: IHumanBody,
    side: "left" | "right",
    flat: HumanFoot.IPlacement,
    heading: number,
    strike: number,
    toeOff: number,
    push: number,
    raised: number = 0,
    backward: boolean = false,
  ): (seconds: number) => IFoot {
    const struck: boolean = Number.isFinite(strike);
    const leaves: boolean = Number.isFinite(toeOff);
    const length: number =
      struck && leaves ? toeOff - strike : 1;
    const settle: number = 0.4 * (leaves ? length : 0.6);
    const rise: number = leaves ? toeOff - 0.4 * (struck ? length : 0.6) : Infinity;
    const settled: number = strike + settle;
    const heelSpan: number = HEEL_SHARE * length;
    const heelEnd: number = strike + heelSpan;
    const heelStart: number = toeOff - heelSpan;
    const pushSpan: number = toeOff - rise;
    const level: IAutoMovieQuaternion = HumanFoot.rotation(heading, 0);
    const pivots: Partial<Record<"heel" | "mtp", ReturnType<typeof HumanFoot.preparePivot>>> = {};
    const rock: (degrees: number, about: "heel" | "mtp") => HumanFoot.IPlacement = (degrees: number, about: "heel" | "mtp"): HumanFoot.IPlacement =>
      (pivots[about] ??= HumanFoot.preparePivot(body, side, about, HumanFoot.point(body, side, about, flat), heading))(degrees);
    if (backward && !(raised > 0)) return (t: number): IFoot => {
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
        const degrees: number = STRIKE * minimumJerk.share((t - heelStart) / heelSpan);
        return {
          placement: rock(degrees, "heel"),
          toes: 0,
        };
      }
      return { placement: { ankle: flat.ankle, rotation: { ...level } }, toes: 0 };
    };
    if (raised > 0) return (t: number): IFoot => {
      // On the ball throughout: the heel's height, eased up from a flat start and down to a flat stop, and the forefoot rocker's pitch where it is steeper.
      const held: number =
        raised *
        (struck ? 1 : minimumJerk.share(t / RISE)) *
        (leaves ? 1 : 1 - minimumJerk.share((t - strike) / RISE));
      const degrees: number = Math.min(
        -held,
        t > rise ? push * minimumJerk.share((t - rise) / pushSpan) : 0,
      );
      return {
        placement: rock(degrees, "mtp"),
        toes: -degrees,
      };
    };
    return (t: number): IFoot => {
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
      return { placement: { ankle: flat.ankle, rotation: { ...level } }, toes: 0 };
    };
  }

  /**
   * A swinging foot between the stance it left and the stance it lands in.
   *
   * @param body The body.
   * @param side The foot.
   * @param props The two ends, the ankle's velocity at the first (m/s), the
   *   rates its pitch and its toes leave the first with (degrees per second,
   *   carried over the first half of the swing by the engine's `carriedRate`;
   *   none when absent), the share of the swing, its duration in seconds and
   *   the mid-swing lift in hip heights, whether the leg is kept
   *   straight (`STIFF`, `LEVEL`), and whether the foot sets down at rest
   *   over its landing in terminal swing (a walking foot; a running one
   *   strikes moving), true when absent.
   * @returns The swinging foot.
   */
  export function swing(
    body: IHumanBody,
    side: "left" | "right",
    props: {
      from: IEnd;
      velocity: IAutoMovieVector3;
      rates?: { pitch: number; toes: number };
      to: IEnd;
      u: number;
      seconds: number;
      lift: number;
      stiff?: boolean;
      settles?: boolean;
    },
  ): IFoot {
    return prepareSwing(body, side, props)(props.u);
  }

  /**
   * Prepare a swing whose body, endpoint stances and initial rates are fixed.
   * The returned reader accepts its share in any order and owns no sample cache.
   *
   * @param body The body whose hip height scales the authored lift.
   * @param side The swinging foot.
   * @param props The fixed inputs of `swing`, without its queried share.
   * @returns The same swinging foot as `swing` at each share.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the fixed inputs, random-access share reader and lifetime.
   * @evidence contracts/development/implementation.md#principled-implementation Evaluates the same minimum-jerk travel, carried rates, raised-cosine lift and sole-clearance correction as `swing`; only endpoint angle decomposition and terminal-settle preparation leave the reader.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Fixed swing geometry precedes one reader of its varying share.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The authored lift, stiffness, rates, duration and landing rule retain their original formulas and bounds.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant preparation and work per share; endpoint quaternion decompositions, coordinate deltas, lift height, fixed time prefixes and terminal-settle inverse trigonometry run once per prepared swing. Height-only heel queries omit unread world-point components.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The reader shares preparation only for the fixed body, side and endpoint inputs it closes over.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each reader retains one swing's fixed inputs and scalar terms until its owning plan releases it, with no query-dependent growth.
   */
  export function prepareSwing(
    body: IHumanBody,
    side: "left" | "right",
    props: Omit<Parameters<typeof swing>[2], "u">,
  ): (share: number) => IFoot {
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
    const fromAngles: ReturnType<typeof HumanFoot.headingPitch> = HumanFoot.headingPitch(props.from.rotation);
    const toAngles: ReturnType<typeof HumanFoot.headingPitch> = HumanFoot.headingPitch(props.to.rotation);
    const leaving: number = fromAngles.heading;
    const headingDelta: number = wrapDegrees(
      toAngles.heading - leaving,
    );
    const left: number = fromAngles.pitch;
    const pitchDelta: number = toAngles.pitch - left;
    const rolled: number = HumanFoot.roll(props.from.rotation);
    const rollDelta: number = HumanFoot.roll(props.to.rotation) - rolled;
    const heel: ReturnType<typeof HumanFoot.prepareHeight> = HumanFoot.prepareHeight(body, side, "heel");
    const toe: ReturnType<typeof HumanFoot.prepareHeight.articulated> = HumanFoot.prepareHeight.articulated(body, side, "toe");
    const delta: IAutoMovieVector3 = Vector3.subtract(props.to.ankle, props.from.ankle);
    const carriedSeconds: number = (1 - settle) * props.seconds;
    const turnSeconds: number = (stiff ? LEVEL : 0.5) * props.seconds;
    const levelSeconds: number = LEVEL * props.seconds;
    return (share: number): IFoot => {
      const u: number = Math.min(1, Math.max(0, share));
      const travel: number = Math.min(1, u / (1 - settle));
      const s: number = minimumJerk.share(travel);
      const carried: number = carriedRate(
        carriedSeconds,
        travel * (1 - settle) * props.seconds,
      );
      const bump: number = Math.sin(Math.PI * u) ** 2;

      // A leg kept straight cannot carry its heel's rise through the swing: its foot is down at its landing height and pitch by `LEVEL` of the swing, and is lifted by `STIFF` of the gait's lift.
      const level: number = stiff ? minimumJerk.share(Math.min(1, u / LEVEL)) : s;
      const rising: number = stiff
        ? carriedRate(levelSeconds, u * props.seconds)
        : carried;
      const a: IAutoMovieVector3 = props.from.ankle;
      const ankle: IAutoMovieVector3 = {
        x: a.x + delta.x * s + props.velocity.x * carried,
        y:
          a.y +
          delta.y * level +
          props.velocity.y * rising +
          height * bump,
        z: a.z + delta.z * s + props.velocity.z * carried,
      };
      const heading: number = leaving + headingDelta * s;
      const turning: number = carriedRate(
        turnSeconds,
        u * props.seconds,
      );
      const toes: number =
        props.from.toes * (1 - minimumJerk.share(Math.min(1, 2 * u))) +
        props.to.toes * minimumJerk.share(Math.max(0, 2 * u - 1)) +
        (props.rates?.toes ?? 0) * turning;

      // A foot that leaves or lands on its edge rolls between the two as its
      // pitch does.
      const placement: HumanFoot.IPlacement = {
        ankle,
        rotation: HumanFoot.rotation(
          heading,
          left + pitchDelta * level + (props.rates?.pitch ?? 0) * turning,
          rolled + rollDelta * level,
        ),
      };
      const low: number = Math.min(
        toe(toes)(placement),
        heel(placement),
      );
      const clearance: number = CLEARANCE * bump;
      if (low < clearance) ankle.y += clearance - low;
      return { placement, toes };
    };
  }

  /** The pitch a foot strikes the floor with, degrees toes-up (provisional, inside Perry and Burnfield's heel rocker). */
  export const STRIKE: number = 15;

  /** The share of a gait's swing lift a leg kept straight is given: with no knee to fold, its foot clears the floor by little (provisional; the hip hike and the outward arc that real stiff-knee walkers add are not modelled). */
  export const STIFF: number = 0.3;

  /** The share of its swing by which a straight leg's foot is down at its landing height and pitch (provisional): a knee that does not fold cannot hold the heel's rise of toe-off over the floor, so the ankle dorsiflexes and the foot passes low under the hip. */
  export const LEVEL: number = 0.4;

  /** The steepest toe-off pitch of a leg kept straight, degrees toes-down (provisional): the foot leaves nearly flat, where a folding knee lets it leave at about 55. */
  export const STIFF_PUSH: number = 15;

  /** Seconds a walk on the balls of the feet takes to raise the heels from a flat start and to set them down at a flat stop (provisional). */
  export const RISE: number = 0.3;

  /** The rate the forefoot rocker ends with, in push pitches per rocker duration (provisional): the foot is still plantarflexing when the toes leave the floor (Perry and Burnfield), and at 2 the minimum-jerk rise with the engine's `carriedRate` term reversed is exactly `2u³ − u⁴`, monotonic and ending with no acceleration. */
  const LEAVE: number = 2;

  /** The share of a stance its heel rocker takes (provisional; loading response is the first 10 to 12 % of the cycle, Perry and Burnfield). */
  const HEEL_SHARE: number = 0.12;

  /**
   * The least clearance of a swinging foot's toe and heel at mid-swing,
   * metres: the mean minimum toe clearance of level walking, 15.0 mm (SD
   * 4.0 mm, 121 adults of 20 to 79 years on a treadmill; 15.1 +- 0.5 mm SEM
   * for the 41 aged 20 to 39), the second metatarsal head's lowest height in
   * swing over its height in stance (Killeen et al. 2017, Sci Rep 7:1922,
   * read in its PMC full text, PMC5432520). Winter 1992's 1.29 cm (Phys
   * Ther 72:45) agrees; only its abstract was reachable.
   */
  export const CLEARANCE: number = 0.015;
}
