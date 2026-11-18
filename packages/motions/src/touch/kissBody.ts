import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanKiss,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRise,
} from "@automovie/interface";

import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanRise } from "../compose/AutoMovieMotionHumanRise";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The body of a kiss at a share of its solved angles: risen on the toes by
 * the heel raise, leaned from the hips by the pitch and the roll, and,
 * standing, lowered onto the planted legs. The one model both the kiss's
 * solve and its displayed body read, so the mouth the solve places is the
 * mouth the figure shows. The feet stay planted, so no balance is solved:
 * the lean and the rise are the kiss's key poses within their ranges.
 *
 * @param body The body.
 * @param posture The posture the kiss is written over.
 * @param stance Both feet as they stand.
 * @param solved The lean's pitch and roll and the heel raise, degrees.
 * @param share The share of each angle, 0 to 1.
 * @param seated Whether a seat bears the body: it neither rises nor is lowered onto the feet.
 * @returns The posture; its neck and head are the given posture's.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the body is at a share, why one model serves the solve and the display, and each input's unit.
 * @evidence contracts/development/implementation.md#principled-implementation The rise's lift and the lean's pivot scale with the share; standing, the root is lowered as far as the planted legs ask to reach their risen feet (`resolveHumanPosture.lower`).
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The rise, the lean, then the standing lowering.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A seated body neither rises nor is lowered, by the seat's support, not by a flag the caller tunes; nothing is clamped.
 * @evidence contracts/development/implementation.md#efficient-algorithms One pivot and, standing, one lowering with its two leg goals.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The lift, the pivot, the leg goals and the lowering are their owners'; the kiss's solve and display both call this one function.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh posture and retains nothing.
 */
export function kissBody(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  stance: IAutoMovieMotionHumanRise.Stance,
  solved: Pick<IAutoMovieMotionHumanKiss.ISolved, "pitch" | "roll" | "raise">,
  share: number,
  seated: boolean,
): IAutoMovieMotionHumanPosture {
  const raise: number = seated ? 0 : solved.raise * share;
  const leaned: IAutoMovieMotionHumanPosture = AutoMovieMotionHumanLean.pivot(
    body,
    {
      ...posture,
      root: Vector3.add(posture.root, AutoMovieMotionHumanRise.lift(body, stance, raise)),
    },
    { pitch: solved.pitch * share, roll: solved.roll * share },
  );
  if (seated) return leaned;

  // Standing, the root comes down as far as the planted legs ask to reach
  // their risen feet.
  const goal: (side: "left" | "right") => ReturnType<typeof AutoMovieMotionHumanLeg.goal> = (side: "left" | "right"): ReturnType<typeof AutoMovieMotionHumanLeg.goal> =>
    AutoMovieMotionHumanLeg.goal(
      body,
      leaned,
      side,
      AutoMovieMotionHumanRise.foot(body, side, stance[side], raise),
      true,
    );
  return {
    ...leaned,
    root: resolveHumanPosture.lower(body, {
      ...leaned,
      limbs: {
        ...leaned.limbs,
        leftLeg: goal("left"),
        rightLeg: goal("right"),
      },
    }).root,
  };
}
