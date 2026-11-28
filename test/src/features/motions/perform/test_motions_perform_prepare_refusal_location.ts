import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanPerformance,
  AutoMovieMotionHumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { poseBones } from "../../../../../packages/motions/src/posture/internal/poseBones";
import { resolveHumanPostureSource } from "../../../../../packages/motions/src/posture/internal/resolveHumanPostureSource";
import { standingPerformanceState } from "../../internal/fixtures/standingPerformanceState";

/**
 * A refusal while preparing a wrist course locates the action that asks for it.
 *
 * Scenarios:
 *
 * 1. Hold a reachable world wrist goal across the turn event.
 * 2. Ask for a disconnected wrist turn at that event while another action's
 *    location wraps the build.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes a held wrist course from a disconnected turn whose refusal passes through an outer location.
 * @evidence contracts/development/testing.md#behavioral-verification Builds a performance over a stored body, reads its held hand on both sides of the event, and checks the physical refusal and its action identity for the disconnected course.
 * @evidence contracts/development/testing.md#independent-expectations The hold asks for one world point after acquisition. The failing action is the first continueWrist placed for actor, so the refusal belongs to that occurrence even inside reader.observe#3.
 */
export async function test_motions_perform_prepare_refusal_location(): Promise<void> {
  const { state } = await standingPerformanceState();
  const performer = state.performers[0]!;
  const play = (disconnect: boolean): AutoMovieMotionHumanPerformance => {
    const law: IAutoMovieMotionHumanActionLaw = {
      name: "continueWrist",
      interrupts: {},
      plan(context) {
        const base: IAutoMovieMotionHumanPosture = {
          ...context.entry.posture,
          joints: {
            ...context.entry.posture.joints,
            rightUpperArm: [145, 110, 0],
            rightLowerArm: [150, 0, 0],
            rightHand: [0, 0, 0],
          },
          limbs: {},
        };
        const goal = (pose: IAutoMoviePose): IAutoMovieHumanLimbGoal => {
          const bones = poseBones(context.body, pose);
          const wrist = bones.get("rightHand")!;
          return {
            point: wrist.worldPosition,
            bend: bones.get("rightLowerArm")!.worldPosition,
            rotation: wrist.worldRotation,
          };
        };
        const held = goal(
          resolveHumanPostureSource.assemble(context.body, base).pose,
        );
        const alternate = goal({
          ...context.entry.pose,
          joints: [
            ...context.entry.pose.joints.filter(
              (joint) =>
                joint.bone !== "rightUpperArm" &&
                joint.bone !== "rightLowerArm" &&
                joint.bone !== "rightHand",
            ),
            { bone: "rightUpperArm", flexion: -20, abduction: 0, twist: 0 },
            { bone: "rightLowerArm", flexion: 150, abduction: 0, twist: -80 },
            { bone: "rightHand", flexion: 0, abduction: 0, twist: 0 },
          ],
        });
        return {
          duration: 1,
          events: [{ name: "turn", share: 0.5 }],
          contacts: [],
          posture: (seconds) =>
            seconds < 0.1
              ? base
              : {
                  ...base,
                  limbs: {
                    rightArm: disconnect && seconds >= 0.5 ? alternate : held,
                  },
                },
        };
      },
    };
    return AutoMovieMotionHumanRefusal.located(
      { performer: "reader", act: "observe", instance: 3 },
      () =>
        new AutoMovieMotionHumanPerformance({
          seed: "prepare-refusal-location",
          performers: [performer],
          laws: [law],
          composition: {
            type: "intent",
            intent: { subject: performer.subject, capability: law.name },
          },
        }),
    );
  };

  const held = play(false);
  const wrist = (seconds: number) =>
    held.bones(performer.subject, seconds).get("rightHand")!.worldPosition;
  TestValidator.predicate(
    "the same wrist point holds across the turn event",
    AutoMovieEngineVector3.distance(wrist(0.4), wrist(0.6)) <= 1e-6,
  );
  try {
    play(true);
  } catch (error) {
    if (!(error instanceof AutoMovieMotionHumanRefusal)) throw error;
    TestValidator.equals(
      "the disconnected wrist course names its own placed action",
      [
        error.kind,
        error.axis,
        error.value,
        error.performer,
        error.act,
        error.instance,
      ],
      ["reach", "rotation", "rightArm", "actor", "continueWrist", 1],
    );
    return;
  }
  throw new Error("Expected the disconnected wrist course to refuse");
}
