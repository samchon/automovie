import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanSupportCarry,
  IAutoMovieMotionHumanWalkParams,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walk } from "../actions/walk";
import { HumanSupportCarry } from "../carrier/HumanSupportCarry";

/**
 * One step of a long insertion's stance along the bore's line: the walk
 * law's own plan from the stance it leaves to the one it reaches, the body
 * keeping its heading (`IAutoMovieMotionHumanWalkParams.facing`) and its
 * arms to the insertion. The entry is the act's own, carried to the stance
 * left as `HumanSupportStep` carries a walk onto its support's frame: its
 * posture, pose root and feet moved along the line, at rest.
 *
 * @param context The operation's context.
 * @param toward The unit horizontal line the stance moves along.
 * @param from The stance left, metres along the line from the entry's.
 * @param to The stance reached, metres along the line from the entry's.
 * @returns The walk's plan, from its own second 0.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the walk, the heading kept and the carried entry.
 * @evidence contracts/development/implementation.md#principled-implementation The walk plans the step from a standing entry at the stance it leaves; the entry is a rigid translation of the act's.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Carry the entry, aim the walk, plan it.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The feet move only by the walk's steps.
 * @evidence contracts/development/implementation.md#efficient-algorithms One walk plan.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the walk law and the support carry's posture translation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns the walk's plan and retains nothing.
 */
export function operateLongInsertStep(
  context: IAutoMovieMotionHumanActionContext<object>,
  toward: IAutoMovieVector3,
  from: number,
  to: number,
): IAutoMovieMotionHumanActionPlan {
  const carry: IAutoMovieMotionHumanSupportCarry.ICarry =
    operateLongInsertStep.stance(toward, from);
  const entry: IAutoMovieMotionHumanEntryState = context.entry;
  const moved: IAutoMovieMotionHumanEntryState = {
    ...entry,
    velocity: { ...entry.velocity, linear: { x: 0, y: 0, z: 0 } },
    posture: HumanSupportCarry.posture(carry, entry.posture),
    pose:
      entry.pose.root === undefined || entry.pose.root === null
        ? entry.pose
        : {
            ...entry.pose,
            root: {
              ...entry.pose.root,
              translation: carry.point(entry.pose.root.translation),
            },
          },
    feet: {
      left: { ...entry.feet.left, ankle: carry.point(entry.feet.left.ankle) },
      right: {
        ...entry.feet.right,
        ankle: carry.point(entry.feet.right.ankle),
      },
    },
  };
  const root: IAutoMovieVector3 = operateLongInsertStep
    .stance(toward, to)
    .point(entry.posture.root);
  const floor: number =
    Math.min(entry.feet.left.ankle.y, entry.feet.right.ankle.y) -
    context.body.measure.ankleHeight;
  const params: IAutoMovieMotionHumanWalkParams = {
    to: { x: root.x, y: floor, z: root.z },
    face: entry.posture.yaw,
    facing: { yaw: entry.posture.yaw },
    armSwing: 0,
  };
  return walk.plan({ ...context, params, entry: moved });
}

/**
 * The stance carry of {@link operateLongInsertStep}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the stance's translation.
 * @evidence contracts/development/design.md#principled-representation A support carry: a rigid horizontal translation, no turn.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the step and the insertion's standing base read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the support carry's record.
 */
export namespace operateLongInsertStep {
  /**
   * The translation that carries the entry's stance a distance along the line.
   *
   * @param toward The unit horizontal line.
   * @param x Metres along it.
   * @returns The carry.
   */
  export function stance(
    toward: IAutoMovieVector3,
    x: number,
  ): IAutoMovieMotionHumanSupportCarry.ICarry {
    return {
      point: (p: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(p, Vector3.scale(toward, x)),
      turn: { x: 0, y: 0, z: 0, w: 1 },
      yaw: 0,
    };
  }
}
