import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSelfAction,
} from "@automovie/interface";
import {
  poseBones,
  resolveHumanPosture,
  selfAction,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `selfAction.plan` stages a whole-body self action as a phrase: the parts rise
 * to their place, hold and return. Victory raises both arms overhead and
 * outside the shoulders, as winners raise their arms above the shoulders and
 * away from the body (Hwang and Matsumoto 2014); a fist pump raises one.
 *
 * Scenarios, the average man standing at the origin:
 *
 * 1. Victory: at `ready` both wrists lie above the shoulders by more than the
 *    upper arm's length, and the left wrist outside the left shoulder, the
 *    right outside the right; at the start they hang below the shoulders.
 * 2. A right fist pump: at `ready` the right wrist lies above the shoulders and
 *    the left still hangs below them.
 *
 * The body is built whole (`humanFixtureBody`): the plan solves both arms on
 * the body's rig and the wrists are read by forward kinematics of the whole
 * posture.
 */
export async function test_unit_motions_touch_self_action(): Promise<void> {
  // Plans both arms on the whole body: the rig, the arm chains and the pose resolution.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const plan = (
    params: IAutoMovieMotionHumanSelfAction.IParams,
  ): IAutoMovieMotionHumanActionPlan =>
    selfAction.plan(motionActionContext(body, params));
  const read = (of: IAutoMovieMotionHumanActionPlan, seconds: number) =>
    poseBones(body, resolveHumanPosture(body, of.posture(seconds)));
  const ready = (of: IAutoMovieMotionHumanActionPlan): number =>
    of.duration *
    of.events.find((e: IAutoMovieMotionEvent): boolean => e.name === "ready")!
      .share;
  const shoulder: number = body.measure.shoulderHeight;
  const victory: IAutoMovieMotionHumanActionPlan = plan({ kind: "victory" });
  const raised = read(victory, ready(victory));
  const hung = read(victory, 0);
  // The left shoulder's side of the midline: +1 when it lies toward +X.
  const outward: number = Math.sign(
    raised.get("leftUpperArm")!.worldPosition.x -
      raised.get("rightUpperArm")!.worldPosition.x,
  );
  TestValidator.predicate(
    "victory",
    raised.get("leftHand")!.worldPosition.y >
      shoulder + body.measure.upperArm &&
      raised.get("rightHand")!.worldPosition.y >
        shoulder + body.measure.upperArm &&
      (raised.get("leftHand")!.worldPosition.x -
        raised.get("leftUpperArm")!.worldPosition.x) *
        outward >
        0 &&
      (raised.get("rightHand")!.worldPosition.x -
        raised.get("rightUpperArm")!.worldPosition.x) *
        outward <
        0 &&
      hung.get("leftHand")!.worldPosition.y < shoulder &&
      hung.get("rightHand")!.worldPosition.y < shoulder,
  );
  const pump: IAutoMovieMotionHumanActionPlan = plan({
    kind: "fistPump",
    hand: "right",
  });
  const pumped = read(pump, ready(pump));
  TestValidator.predicate(
    "a fist pump",
    pumped.get("rightHand")!.worldPosition.y > shoulder &&
      pumped.get("leftHand")!.worldPosition.y < shoulder,
  );
}
