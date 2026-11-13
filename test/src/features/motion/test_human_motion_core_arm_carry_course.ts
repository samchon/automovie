import { createDrinkware } from "@automovie/archetypes";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanArm,
  HumanChain,
  HumanObject,
  HumanPerformance,
  type IHumanBody,
  type IHumanPosture,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * An arm carried by a blend of its joints from the angles it hangs at to a
 * goal moves its hand on one course: equal shares of the carry move the
 * wrist by near-equal steps, and the carry meets the goal's own pose at its
 * end.
 *
 * Scenario, on the average man: the goal is the first posture of a pick-up
 * of a glass at 0.55 of his stature and a fifth of it ahead that carries a
 * goal for the right arm, and the held angles are the right arm's at the
 * film's start, where it hangs. This is the cell in which
 * `test_human_motion_core_pick_up_reach` read a step of 37 mm, so one body
 * and one goal are enough: the rule is about the carry and not the body.
 * The carry is read at 201 shares, 1/200 apart.
 * 1. At share 0 the wrist is where the hanging arm has it, within 1 mm.
 * 2. No step between two neighbouring shares moves the wrist by more than
 *    five times the mean step. Joints blended in equal shares move the hand
 *    in near-equal steps, and an elbow let out for clearance adds to a few
 *    of them; a change of the arm's solution is tens of mean steps.
 * 3. The last carried share, 199/200, has the wrist within five mean steps
 *    of the goal's own pose, so the carry joins the goal without a step.
 *
 * A failing row names the share, the step, the mean, the upper and lower
 * arm's joint angles on both sides of the step, and those of the two ends.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public carry over a posture the public performance gives and reads the resolved wrist; a clearance that changes direction between two shares, or a carry that ends away from its goal, fails.
 * @evidence contracts/development/testing.md#independent-expectations The mean step is the measured course's own length over its 200 steps, and the bound is a multiple of it stated from what a joint blend is; nothing is read from the carry's clearance.
 * @evidence contracts/development/testing.md#distinguishing-cases The start, every step and the end of one carry near the arm's straight reach, the cell that stepped. The room a carried forearm keeps is `test_human_motion_compose_arm_carry`'s; the film's own continuity is `test_human_motion_core_pick_up_reach`'s.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and one archetype, builds one performance and 201 carried postures in memory; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the scenario, why one body is enough, the 3 expectations and what a failing row carries.
 */
export function test_human_motion_core_arm_carry_course(): void {
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(1);
  const body: IHumanBody = motionHumanBody("m-average");
  const stature: number = body.measure.stature;
  const film: HumanPerformance = new HumanPerformance({
    seed: "reach",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    props: [
      HumanObject.prop("glass", createDrinkware({ kind: "glass" }), {
        at: { x: 0.15, y: 0.55 * stature, z: 0.2 * stature },
        yaw: 0,
      }),
    ],
    composition: HumanChain.subject("a").pickUp({
      prop: "glass",
      handle: "body",
      hand: "right",
    }).node,
  });

  // The first posture of the film that carries a goal for the right arm.
  let goal: IHumanPosture | undefined;
  for (let t: number = 0; t <= film.duration + 1e-9; t += 1 / 120) {
    const posture: IHumanPosture = film.posture("a", t);
    if (posture.limbs.rightArm === undefined) continue;
    goal = posture;
    break;
  }
  if (goal === undefined) {
    TestValidator.equals(
      "a carried arm keeps one course",
      ["the pick-up never carries a goal for the right arm"],
      [],
    );
    return;
  }
  const held: AutoMovieMotionHumanArm.IAngles = AutoMovieMotionHumanArm.angles(
    film.pose("a", 0),
    "right",
  );
  const hanging: IAutoMovieVector3 = film
    .bones("a", 0)
    .get("rightHand")!.worldPosition;

  interface IReading {
    wrist: IAutoMovieVector3;
    joints: string;
  }
  const triple = (
    angles: readonly [number, number, number] | undefined,
  ): string =>
    angles === undefined
      ? "goal"
      : angles.map((a: number): string => a.toFixed(1)).join("/");
  const read = (share: number): IReading => {
    const posture: IHumanPosture = AutoMovieMotionHumanArm.carry(
      body,
      goal,
      { right: held },
      share,
    );
    return {
      wrist: poseBones(body, resolveHumanPosture(body, posture)).get(
        "rightHand",
      )!.worldPosition,
      joints: `upper ${triple(posture.joints.rightUpperArm)} lower ${triple(posture.joints.rightLowerArm)}`,
    };
  };
  const solved: AutoMovieMotionHumanArm.IAngles =
    AutoMovieMotionHumanArm.angles(resolveHumanPosture(body, goal), "right");
  const gap = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  const SHARES: number = 200;
  const readings: IReading[] = [];
  for (let k: number = 0; k <= SHARES; k++) readings.push(read(k / SHARES));

  // 1. The carry starts where the arm hangs.
  if (gap(readings[0]!.wrist, hanging) > 0.001)
    complaints.push(
      `at share 0 the wrist is ${mm(gap(readings[0]!.wrist, hanging))} mm from where the arm hangs, within 1 mm expected`,
    );

  // 2 and 3. No step stands out of the course, the last one included.
  let length: number = 0;
  for (let k: number = 1; k <= SHARES; k++)
    length += gap(readings[k]!.wrist, readings[k - 1]!.wrist);
  const mean: number = length / SHARES;
  for (let k: number = 1; k <= SHARES; k++) {
    const step: number = gap(readings[k]!.wrist, readings[k - 1]!.wrist);
    if (step > 5 * mean)
      complaints.push(
        `from share ${(k - 1) / SHARES} to ${k / SHARES} the wrist moves ${mm(step)} mm, the mean step being ${mm(mean)} mm and five of it the bound; before: ${readings[k - 1]!.joints}; after: ${readings[k]!.joints}; the held arm: upper ${triple(held.upper)} lower ${triple(held.lower)}; the goal's: upper ${triple(solved.upper)} lower ${triple(solved.lower)}`,
      );
  }
  TestValidator.equals("a carried arm keeps one course", complaints, []);
}
