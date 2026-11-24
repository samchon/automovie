import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanArm,
  AutoMovieMotionHumanBend,
  composeAutoMovieMotionHumanAction,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { linearMotionClock } from "../../../internal/synthetic/linearMotionClock";
import { syntheticHumanPlan } from "../../../internal/synthetic/syntheticHumanPlan";
import { vclose } from "../../../internal/vclose";

/**
 * How near the held hand lies to its goal, metres: the arm's plan is solved to
 * a millimetre at its knots (`HumanArmTrajectoryTerms.TOLERANCE`), and the
 * displayed fit places the hand on the same goal.
 */
const REACH: number = 1e-3;

/**
 * `AutoMovieMotionHumanArm.carried` writes an arm planned once over its span
 * (`AutoMovieMotionHumanArmPlanned.planned`, the sampled path refined by
 * sequential convex optimisation) and, off the span, the joint-space carry from
 * its rest by its weight; composed into an action, the plan is made when the
 * action is (`prepare`) and the off-span carry is solved at knots when the
 * action is prepared (`ready`).
 *
 * The average man stands still for 2 s; his right hand reaches from where it
 * hangs to 0.25 m up and 0.25 m forward over 0.2 to 0.8 s, holds there to
 * 1.4 s and returns by 1.8 s.
 *
 * Scenarios:
 *
 * 1. Over the hold the hand lies on its goal.
 * 2. Before the reach the arm keeps its rest angles' shoulder.
 * 3. Once the action is prepared the hold shows the same hand.
 */
export async function test_unit_motions_compose_arm_carried(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const standing: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: body.measure.hipHeight, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  const rest: IAutoMoviePose = resolveHumanPosture(body, standing);
  const hang: IAutoMovieVector3 = poseBones(body, rest).get(
    "rightHand",
  )!.worldPosition;
  const angles: IAutoMovieMotionHumanArmAngles.IAngles =
    AutoMovieMotionHumanArm.angles(rest, "right");
  const point: IAutoMovieVector3 = {
    x: hang.x,
    y: hang.y + 0.25,
    z: hang.z + 0.25,
  };
  const goal: IAutoMovieHumanLimbGoal = {
    point,
    bend: AutoMovieMotionHumanBend.hang(body, standing, "right"),
  };
  const clock = linearMotionClock(2, [
    { name: "reach", seconds: 0.2 },
    { name: "ready", seconds: 0.8 },
    { name: "relax", seconds: 1.4 },
    { name: "back", seconds: 1.8 },
  ]);
  const plan: IAutoMovieMotionHumanActionPlan =
    composeAutoMovieMotionHumanAction({
      base: syntheticHumanPlan({ duration: 2, posture: standing }),
      clock,
      primitives: [
        AutoMovieMotionHumanArm.carried({
          body,
          side: "right",
          from: 0,
          to: 2,
          rest: angles,
          span: { start: 0.2, ready: 0.8, relax: 1.4, end: 1.8 },
          weight: (seconds: number): number =>
            clock.envelope(["reach", "ready"], ["relax", "back"], seconds),
          goal: (): IAutoMovieHumanLimbGoal => goal,
        }),
      ],
    });
  const hand = (seconds: number): IAutoMovieVector3 =>
    poseBones(body, resolveHumanPosture(body, plan.posture(seconds))).get(
      "rightHand",
    )!.worldPosition;

  // 1. The hold.
  TestValidator.predicate(
    "the held hand lies on its goal",
    [0.9, 1.1, 1.3].every((t: number): boolean =>
      vclose(hand(t), point, REACH),
    ),
  );

  // 2. Before the reach.
  TestValidator.equals(
    "the shoulder rests before the reach",
    plan.posture(0.1).joints.rightUpperArm,
    angles.upper,
  );

  // 3. Prepared.
  plan.prepare?.();
  TestValidator.predicate(
    "the prepared hold shows the same hand",
    vclose(hand(1.1), point, REACH),
  );
}
