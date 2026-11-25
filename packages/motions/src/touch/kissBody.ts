import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanKiss,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRise,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanRise } from "../compose/AutoMovieMotionHumanRise";
import { lowerHumanPosture } from "../posture/lowerHumanPosture";

/** The alternatives of `KissBodySolved`'s site. */
type KissBodySolved =
  | "pitch"
  | "roll"
  | "raise"
  | "sink"
  | "shift"
  | "advance"
  | "bearing";

/**
 * The body of a kiss at a share of its solved angles: risen on the toes by the
 * heel raise, leaned from the hips by the pitch and the roll, and, standing,
 * lowered onto the planted legs. The one model both the kiss's solve and its
 * displayed body read, so the mouth the solve places is the mouth the figure
 * shows. The feet stay planted, so no balance is solved: the lean and the rise
 * are the kiss's key poses within their ranges.
 *
 * @param body The body.
 * @param posture The posture the kiss is written over.
 * @param stance Both feet as they stand.
 * @param solved The lean's pitch and roll and the heel raise, degrees, with
 *   optional supported descent in metres.
 * @param share The share of each angle, 0 to 1.
 * @param seated Whether a seat bears the body: it neither rises nor is lowered
 *   onto the feet.
 * @returns The posture; its neck and head are the given posture's.
 */
export function kissBody(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  stance: IAutoMovieMotionHumanRise.Stance,
  solved: Pick<IAutoMovieMotionHumanKiss.ISolved, KissBodySolved>,
  share: number,
  seated: boolean,
): IAutoMovieMotionHumanPosture {
  const raise: number = seated ? 0 : solved.raise * share;
  const lateral: number = (solved.shift ?? 0) * share;
  const forward: number = (solved.advance ?? 0) * share;
  const yaw: number = (posture.yaw * Math.PI) / 180;
  const feet: IAutoMovieVector3 = AutoMovieMotionHumanRise.lift(
    body,
    stance,
    raise,
  );
  const leaned: IAutoMovieMotionHumanPosture = AutoMovieMotionHumanLean.pivot(
    body,
    {
      ...posture,
      yaw: posture.yaw + (solved.bearing ?? 0) * share,
      root: Vector3.add(posture.root, {
        x: feet.x + lateral * Math.cos(yaw) + forward * Math.sin(yaw),
        y: feet.y,
        z: feet.z - lateral * Math.sin(yaw) + forward * Math.cos(yaw),
      }),
    },
    { pitch: solved.pitch * share, roll: solved.roll * share },
  );
  if (seated) return leaned;

  // Standing, the root comes down as far as the planted legs ask to reach
  // their risen feet.
  const goal: (
    side: AutoMovieHumanSide,
  ) => ReturnType<typeof AutoMovieMotionHumanLeg.goal> = (
    side: AutoMovieHumanSide,
  ): ReturnType<typeof AutoMovieMotionHumanLeg.goal> =>
    AutoMovieMotionHumanLeg.goal(
      body,
      leaned,
      side,
      AutoMovieMotionHumanRise.foot(body, side, stance[side], raise),
      true,
    );
  const root: IAutoMovieVector3 = lowerHumanPosture(body, {
    ...leaned,
    limbs: {
      ...leaned.limbs,
      leftLeg: goal("left"),
      rightLeg: goal("right"),
    },
  }).root;
  const sink: number = (solved.sink ?? 0) * share;
  return { ...leaned, root: sink === 0 ? root : { ...root, y: root.y - sink } };
}
