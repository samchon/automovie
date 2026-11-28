import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanArm
} from "../../../../../packages/motions/src/compose/internal/AutoMovieMotionHumanArm";
import {
  AutoMovieMotionHumanBend
} from "../../../../../packages/motions/src/compose/internal/AutoMovieMotionHumanBend";
import {
  composeMotionHumanAction
} from "../../../../../packages/motions/src/compose/internal/composeMotionHumanAction";
import {
  poseBones
} from "../../../../../packages/motions/src/posture/internal/poseBones";
import {
  resolveHumanPosture
} from "../../../../../packages/motions/src/posture/internal/resolveHumanPosture";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { linearMotionClock } from "../../internal/synthetic/linearMotionClock";
import { syntheticHumanPlan } from "../../internal/synthetic/syntheticHumanPlan";
import { vclose } from "../../internal/vclose";

/**
 * How near the held hand lies to its goal, metres: the arm's plan is solved to
 * a millimetre at its knots (`HumanArmTrajectoryTerms.TOLERANCE`), and the
 * displayed fit places the hand on the same goal.
 */
const REACH: number = 1e-3;

/**
 * The resting shoulder's abduction, degrees: enough to hold the upper arm off
 * the trunk's colliders, which a hanging arm at clinical zero touches.
 */
const ABDUCTION: number = 15;

/**
 * `AutoMovieMotionHumanArm.carried` writes an arm planned once over its span
 * (`AutoMovieMotionHumanArmPlanned.planned`, the sampled path refined by
 * sequential convex optimisation) and, off the span, the joint-space carry from
 * its rest by its weight; composed into an action, the plan is made when the
 * action is (`prepare`) and the off-span carry is solved at knots when the
 * action is prepared (`ready`).
 *
 * The average man stands still for 2 s, his right arm hanging abducted 15
 * degrees; his right hand reaches from where it hangs to 0.25 m up and 0.25 m
 * forward over 0.2 to 0.8 s, holds there to 1.4 s and returns by 1.8 s.
 *
 * Scenarios:
 *
 * 1. Over the hold the hand lies on its goal.
 * 2. Before the reach the arm keeps its rest angles' shoulder.
 * 3. Once the action is prepared the hold shows the same hand.
 *
 * The body is built whole (`humanFixtureBody`): the arm's plan reads the body's
 * pose rig, limb chains, ROM projection, collider bones and tangle model, and
 * the hand is read by resolving the whole posture.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the timed reach, hold and return along with the shoulder before motion and the prepared hold sample.
 * @evidence contracts/development/testing.md#behavioral-verification Composes a carried arm on the stored body rig, then reads the produced posture and reads the resolved hand at three hold seconds and after preparation.
 * @evidence contracts/development/testing.md#independent-expectations The target is an authored offset of 0.25 m up and 0.25 m forward from the resting hand. The hold must reach that point within the fixture's tolerance, and the earlier shoulder must match the held angles.
 */
export async function test_motions_compose_arm_carried(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  // The right arm hangs abducted clear of the trunk: an arm's plan leaves its
  // action only from outside every body.
  const standing: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: body.measure.hipHeight, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: { rightUpperArm: [0, ABDUCTION, 0] },
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
  const clock: IAutoMovieMotionClock = linearMotionClock(2, [
    { name: "reach", seconds: 0.2 },
    { name: "ready", seconds: 0.8 },
    { name: "relax", seconds: 1.4 },
    { name: "back", seconds: 1.8 },
  ]);
  const plan: IAutoMovieMotionHumanActionPlan =
    composeMotionHumanAction({
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
