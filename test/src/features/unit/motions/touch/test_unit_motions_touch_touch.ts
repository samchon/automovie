import { resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanTouch,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  poseBones,
  resolveHumanPosture,
  touch,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `touch.plan` stages a hand on a body region: the hand reaches the region,
 * strokes `count` times, holds and returns, with `ready` on the region and the
 * contact declared there.
 *
 * Scenarios, the average man standing at the origin:
 *
 * 1. The right fingertips pressing the own sternum once and holding 0.3 s: at
 *    `ready` the right wrist lies within a hand's length of the sternum's
 *    surface point (the fingertips are on it, the wrist a hand behind them),
 *    and the left wrist has not moved from where it hung by more than a
 *    centimetre.
 * 2. The left palm on the right thigh's front: at `ready` the left wrist lies
 *    within a hand's length of the thigh's surface point.
 * 3. Both touches start from the entry posture: at 0 the right wrist is where it
 *    hung.
 *
 * The body is built whole (`humanFixtureBody`): the plan solves the arm on the
 * body's rig and surfaces, and the wrists are read by forward kinematics of the
 * whole posture.
 */
export async function test_unit_motions_touch_touch(): Promise<void> {
  // Plans the touch on the whole body: the rig, the arm chains, the surfaces and the pose resolution.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const read = (
    plan: IAutoMovieMotionHumanActionPlan,
    seconds: number,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
    poseBones(body, resolveHumanPosture(body, plan.posture(seconds)));
  const ready = (plan: IAutoMovieMotionHumanActionPlan): number =>
    plan.duration *
    plan.events.find((e: IAutoMovieMotionEvent): boolean => e.name === "ready")!
      .share;
  const distance = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  const region = (
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    name: "sternum" | "thighFrontRight",
  ): IAutoMovieVector3 => {
    const frame = body.surfaces.regions[name];
    return resolveAutoMovieHumanoidSurfaces.place(frame, bones.get(frame.bone)!)
      .point;
  };
  const sternum: IAutoMovieMotionHumanActionPlan = touch.plan(
    motionActionContext<IAutoMovieMotionHumanTouch.IParams>(body, {
      target: { kind: "self", region: "sternum" },
      hand: "right",
      kind: "press",
      effector: "fingertips",
      count: 1,
      hold: 0.3,
    }),
  );
  const pressed = read(sternum, ready(sternum));
  const hung = read(sternum, 0);
  TestValidator.predicate(
    "on the sternum",
    distance(
      pressed.get("rightHand")!.worldPosition,
      region(pressed, "sternum"),
    ) <= body.measure.hand &&
      distance(
        pressed.get("leftHand")!.worldPosition,
        hung.get("leftHand")!.worldPosition,
      ) <= 0.01,
  );
  const thigh: IAutoMovieMotionHumanActionPlan = touch.plan(
    motionActionContext<IAutoMovieMotionHumanTouch.IParams>(body, {
      target: { kind: "self", region: "thighFrontRight" },
      hand: "left",
      kind: "pat",
      effector: "palm",
      count: 1,
      hold: 0,
    }),
  );
  const patted = read(thigh, ready(thigh));
  TestValidator.predicate(
    "on the thigh",
    distance(
      patted.get("leftHand")!.worldPosition,
      region(patted, "thighFrontRight"),
    ) <= body.measure.hand,
  );
  TestValidator.predicate(
    "from the entry",
    distance(
      read(thigh, 0).get("rightHand")!.worldPosition,
      hung.get("rightHand")!.worldPosition,
    ) <= 1e-6,
  );
}
