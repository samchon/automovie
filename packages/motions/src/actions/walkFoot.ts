import {
  Quaternion,
  carriedRate,
  minimumJerk,
  wrapDegrees,
} from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";

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
 * further wherever the toe or heel would come within 12 mm of the floor; its
 * heading and pitch turn between the two placements' on the minimum-jerk
 * profile, and the toes relax over the first half and take the landing's
 * flexion over the second.
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
   * A foot's heading from its rotation, read off its lateral axis: a pitch
   * leaves that axis level, so the heading holds when a folded shank carries
   * the foot's pitch past vertical, where its forward axis points backward.
   *
   * @param rotation The foot's world rotation, a heading and a pitch.
   * @returns Degrees about +Y.
   */
  export function yaw(rotation: IAutoMovieQuaternion): number {
    const lateral: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
      x: 1,
      y: 0,
      z: 0,
    });
    return (Math.atan2(-lateral.z, lateral.x) * 180) / Math.PI;
  }

  /**
   * A foot's pitch from its rotation, about the lateral axis `yaw` reads, so
   * it runs past ±90° where the foot points past vertical.
   *
   * @param rotation The foot's world rotation, a heading and a pitch.
   * @returns Degrees, positive toes up.
   */
  export function pitch(rotation: IAutoMovieQuaternion): number {
    const toes: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
      x: 0,
      y: 0,
      z: 1,
    });
    const heading: number = (yaw(rotation) * Math.PI) / 180;
    return (
      (Math.atan2(
        toes.y,
        toes.x * Math.sin(heading) + toes.z * Math.cos(heading),
      ) *
        180) /
      Math.PI
    );
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
  ): IFoot {
    const length: number =
      Number.isFinite(strike) && Number.isFinite(toeOff) ? toeOff - strike : 1;
    if (Number.isFinite(strike) && t < strike + HEEL_SHARE * length) {
      const degrees: number =
        STRIKE * (1 - minimumJerk((t - strike) / (HEEL_SHARE * length)).s);
      return {
        placement: rocked(body, side, flat, heading, degrees, "heel"),
        toes: 0,
      };
    }
    if (Number.isFinite(toeOff)) {
      const rise: number =
        toeOff - 0.4 * (Number.isFinite(strike) ? length : 0.6);
      if (t > rise) {
        const u: number = (t - rise) / (toeOff - rise);
        const degrees: number =
          push * (minimumJerk(u).s - LEAVE * carriedRate(1, 1 - u));
        return {
          placement: rocked(body, side, flat, heading, degrees, "mtp"),
          toes: -degrees,
        };
      }
    }
    return {
      placement: {
        ankle: flat.ankle,
        rotation: HumanFoot.rotation(heading, 0),
      },
      toes: 0,
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
   *   the mid-swing lift in hip heights.
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
    },
  ): IFoot {
    const u: number = Math.min(1, Math.max(0, props.u));
    const s: number = minimumJerk(u).s;
    const carried: number = carriedRate(props.seconds, u * props.seconds);
    const bump: number = Math.sin(Math.PI * u) ** 2;
    const a: IAutoMovieVector3 = props.from.ankle;
    const b: IAutoMovieVector3 = props.to.ankle;
    const ankle: IAutoMovieVector3 = {
      x: a.x + (b.x - a.x) * s + props.velocity.x * carried,
      y:
        a.y +
        (b.y - a.y) * s +
        props.velocity.y * carried +
        props.lift * body.measure.hipHeight * bump,
      z: a.z + (b.z - a.z) * s + props.velocity.z * carried,
    };
    const leaving: number = HumanFrame.heading(props.from.rotation);
    const heading: number =
      leaving +
      wrapDegrees(HumanFrame.heading(props.to.rotation) - leaving) * s;
    const left: number = pitch(props.from.rotation);
    const turning: number = carriedRate(props.seconds / 2, u * props.seconds);
    const toes: number =
      props.from.toes * (1 - minimumJerk(Math.min(1, 2 * u)).s) +
      props.to.toes * minimumJerk(Math.max(0, 2 * u - 1)).s +
      (props.rates?.toes ?? 0) * turning;
    const placement: HumanFoot.IPlacement = {
      ankle,
      rotation: HumanFoot.rotation(
        heading,
        left +
          (pitch(props.to.rotation) - left) * s +
          (props.rates?.pitch ?? 0) * turning,
      ),
    };
    const low: number = Math.min(
      HumanFoot.point(body, side, "toe", placement, toes).y,
      HumanFoot.point(body, side, "heel", placement).y,
    );
    const clearance: number = CLEARANCE * bump;
    if (low < clearance) ankle.y += clearance - low;
    return { placement, toes };
  }

  /** The pitch a foot strikes the floor with, degrees toes-up (provisional, inside Perry and Burnfield's heel rocker). */
  export const STRIKE: number = 15;

  /** The rate the forefoot rocker ends with, in push pitches per rocker duration (provisional): the foot is still plantarflexing when the toes leave the floor (Perry and Burnfield), and at 2 the minimum-jerk rise with the engine's `carriedRate` term reversed is exactly `2u³ − u⁴`, monotonic and ending with no acceleration. */
  const LEAVE: number = 2;

  /** The share of a stance its heel rocker takes (provisional; loading response is the first 10 to 12 % of the cycle, Perry and Burnfield). */
  const HEEL_SHARE: number = 0.12;

  /** The least clearance of a swinging foot's toe and heel at mid-swing, metres (minimum toe clearance is 10 to 20 mm, Winter 1992). */
  const CLEARANCE: number = 0.012;
}
