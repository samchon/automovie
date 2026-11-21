import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanSupportCarry,
  IAutoMovieMotionHumanWalkParams,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanSupportCarry } from "../carrier/HumanSupportCarry";
import { HumanSupportFrame } from "../carrier/HumanSupportFrame";

/**
 * Plan a walk that starts bearing on a fixed level prop as the floor gait
 * at that prop's height. The entry's loaded soles give the height
 * (`HumanSupportFrame.floor`); the entry is lowered by it, the ordinary
 * floor gait plans from there, and every posture it writes is raised back,
 * so the steps bear on the top the walk began on. A walk that boards a
 * prop from the floor, rides a moving or sloped one, or starts on the
 * floor plans unchanged.
 *
 * @param context The walk's context in world metres.
 * @param subject The prop the walk is `on`.
 * @param plan The floor gait's planner.
 * @returns The gait at the entry's level.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the height's source, the translation both ways and the unchanged cases.
 * @evidence contracts/development/implementation.md#principled-implementation On a fixed level top the floor gait is valid up to a vertical translation, so lowering every consumed world position and raising every written posture by the same height is exact.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure A gate, the floor gait and one rigid translation each way.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Boarding, moving or sloped supports and the floor keep the existing plan; a height under 1 cm is the floor.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work at plan time and one translation per sampled posture.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The floor gait is planned once.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains only the floor gait's plan.
 */
export function walkLevelSupport(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanWalkParams>,
  subject: string,
  plan: (
    given: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanWalkParams>,
  ) => IAutoMovieMotionHumanActionPlan,
): IAutoMovieMotionHumanActionPlan {
  const support: ReturnType<typeof HumanSupportFrame.of> =
    HumanSupportFrame.of(context);
  if (support.kind !== "prop" || support.subject !== subject)
    return plan(context);
  const read: IAutoMovieMotionHumanPropReader = context.prop(subject);
  if (
    read.prop.fixed !== true ||
    read.prop.motion !== undefined ||
    read.prop.hasArticulations === true ||
    Quaternion.rotateVectorY(read.frame(context.start).rotation, {
      x: 0,
      y: 1,
      z: 0,
    }) <
      1 - 1e-6
  )
    return plan(context);
  const entry: IAutoMovieMotionHumanEntryState = context.entry;
  const height: number = HumanSupportFrame.floor(context.body, entry);
  if (!Number.isFinite(height) || Math.abs(height) < 0.01) return plan(context);

  const translate = (dy: number): IAutoMovieMotionHumanSupportCarry.ICarry => ({
    point: (p: IAutoMovieVector3): IAutoMovieVector3 => ({ ...p, y: p.y + dy }),
    turn: { x: 0, y: 0, z: 0, w: 1 },
    yaw: 0,
  });
  const lower: IAutoMovieMotionHumanSupportCarry.ICarry = translate(-height);
  const raise: IAutoMovieMotionHumanSupportCarry.ICarry = translate(height);
  const local: IAutoMovieMotionHumanActionPlan = plan({
    ...context,
    entry: {
      ...entry,
      posture: HumanSupportCarry.posture(lower, entry.posture),
      pose:
        entry.pose.root === undefined || entry.pose.root === null
          ? entry.pose
          : {
              ...entry.pose,
              root: {
                ...entry.pose.root,
                translation: lower.point(entry.pose.root.translation),
              },
            },
      feet: {
        left: { ...entry.feet.left, ankle: lower.point(entry.feet.left.ankle) },
        right: {
          ...entry.feet.right,
          ankle: lower.point(entry.feet.right.ankle),
        },
      },
    },
  });
  return {
    ...local,
    posture: (
      ...args: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>
    ): IAutoMovieMotionHumanPosture =>
      HumanSupportCarry.posture(raise, local.posture(...args)),
  };
}
