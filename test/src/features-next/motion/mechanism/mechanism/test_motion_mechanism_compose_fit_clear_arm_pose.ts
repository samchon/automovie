import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanStance, HumanRefusal } from "@automovie/motions";
import {
  fitClearArmPose,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";

/** One arm goal asked of the fit. */
type Goals = Partial<
  Record<`${AutoMovieHumanSide}Arm`, IAutoMovieHumanLimbGoal>
>;

/**
 * The one-instant clear-pose fit answers with the arm planner's own verdict:
 * a goal the arm reaches clear of the body is admitted with the arm's
 * coursed angles, and a goal inside the trunk is refused with the planner's
 * refusal.
 *
 * Scenarios:
 * 1. A right wrist goal in front of the shoulder, within the arm's reach, is
 *    clear, and the answer writes the coursed right arm's angles.
 * 2. The same goal reached from the quiet stance's arm over half a second
 *    and returned over another, as an action's course lays it, is clear.
 * 3. Both wrists in front of the chest a hand's breadth apart, the two arms
 *    laid together and excused at their grasp, are clear.
 * 4. A right wrist goal at the chest's own joint, inside the trunk, is
 *    refused with a `HumanRefusal`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the verdict's two answers and the three goals.
 * @evidence contracts/development/testing.md#behavioral-verification Calls fitClearArmPose on a quiet stance's posture with each goal and reads the verdict and the coursed posture.
 * @evidence contracts/development/testing.md#independent-expectations Each goal's place follows from the body's own measures: within reach in front of the shoulder, or at the chest joint inside the trunk.
 * @evidence contracts/development/testing.md#distinguishing-cases The same arm and stance are admitted in front of the body and refused inside it; one arm and two grasping arms are each fitted, held from the first instant and reached.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory solves of one polygon man.
 */
export function test_motion_mechanism_compose_fit_clear_arm_pose(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const stance: IAutoMovieMotionHumanPosture =
    AutoMovieMotionHumanStance.stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
  const entry: IAutoMoviePose = resolveHumanPosture(body, stance);
  const bones: ReturnType<typeof poseBones> = poseBones(body, entry);
  const reach: number = body.measure.upperArm + body.measure.forearm;
  const shoulder = (side: AutoMovieHumanSide): IAutoMovieVector3 =>
    bones.get(`${side}UpperArm`)!.worldPosition;
  // The stance faces +Z; an elbow hint hangs below and behind the wrist.
  const goal = (
    side: AutoMovieHumanSide,
    point: IAutoMovieVector3,
  ): IAutoMovieHumanLimbGoal => ({
    point,
    bend: Vector3.add(shoulder(side), { x: 0, y: -0.6 * reach, z: 0 }),
  });
  const fit = (
    goals: Goals,
    second?: AutoMovieHumanSide,
  ): fitClearArmPose.Verdict =>
    fitClearArmPose({
      body,
      posture: { ...stance, limbs: { ...stance.limbs, ...goals } },
      side: "right",
      ...(second === undefined
        ? {}
        : { second, grasp: ["hand", "lowerArm"] as const }),
    });

  const ahead: IAutoMovieVector3 = Vector3.add(shoulder("right"), {
    x: 0,
    y: -0.25 * reach,
    z: 0.7 * reach,
  });
  const single: fitClearArmPose.Verdict = fit({
    rightArm: goal("right", ahead),
  });
  if (!single.clear) throw single.refusal;
  TestValidator.predicate(
    "a wrist in front of the shoulder within reach is clear, with the right arm coursed",
    single.clear && single.posture.joints.rightUpperArm !== undefined,
  );

  const reached: fitClearArmPose.Verdict = fitClearArmPose({
    body,
    posture: {
      ...stance,
      limbs: { ...stance.limbs, rightArm: goal("right", ahead) },
    },
    side: "right",
    reach: { entry, seconds: 0.5, back: 0.5 },
  });
  if (!reached.clear) throw reached.refusal;
  TestValidator.predicate(
    "the same wrist reached from the quiet stance's arm over half a second and returned is clear",
    reached.posture.joints.rightUpperArm !== undefined,
  );

  const middle: IAutoMovieVector3 = Vector3.scale(
    Vector3.add(shoulder("left"), shoulder("right")),
    0.5,
  );
  const handle = (side: AutoMovieHumanSide): IAutoMovieVector3 =>
    Vector3.add(middle, {
      x: (side === "left" ? 0.5 : -0.5) * body.measure.hand,
      y: -0.3 * reach,
      z: 0.6 * reach,
    });
  const both: fitClearArmPose.Verdict = fit(
    {
      rightArm: goal("right", handle("right")),
      leftArm: goal("left", handle("left")),
    },
    "left",
  );
  if (!both.clear) throw both.refusal;
  TestValidator.predicate(
    "two wrists a hand's breadth apart in front of the chest, laid together at their grasp, are clear",
    both.clear,
  );

  const inside: fitClearArmPose.Verdict = fit({
    rightArm: goal("right", bones.get("chest")!.worldPosition),
  });
  TestValidator.predicate(
    "a wrist at the chest joint, inside the trunk, is refused by the planner",
    !inside.clear && inside.refusal instanceof HumanRefusal,
  );
}
