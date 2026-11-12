import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  HumanSignature,
  type IHumanActionContext,
  type IHumanActionLaw,
  type IHumanActionPlan,
  type IHumanBody,
  touch,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../features/internal/motionHumanBody";

/**
 * The hand salute holds the arm the drill manual prescribes: the upper arm
 * horizontal and the elbow inclined slightly forward (US Army TC 3-21.5,
 * Drill and Ceremonies, the hand salute; wording read from the 2012 edition
 * and its training handouts, to be confirmed against the 2021 edition).
 *
 * Pending: registered as a row of `touch` (the forefinger to the right
 * temple), the salute reaches its site but the elbow rides high. On the
 * average man the upper arm lies 30.0 degrees above the horizontal and on
 * the small woman 33.3, with the elbow 24 mm and 8 mm ahead of the shoulder.
 * A touch row cannot state where the elbow goes; the effector and site axis
 * must carry the arm's line for an emblem. The rows are on the registry's
 * issue.
 *
 * Scenarios, on the average man and the small woman, at the middle of the
 * hold:
 * 1. The right upper arm lies within 10 degrees of the horizontal (the
 *    tolerance is provisional).
 * 2. The elbow lies ahead of the shoulder, not behind it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers the salute through the public input, performs it on real bodies and reads displayed joint centres; an arm held off the manual's line fails.
 * @evidence contracts/development/testing.md#independent-expectations The line of the arm is the drill manual's, not a reading of the law.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies of extreme stature; the arm's elevation and its fore-aft place.
 * @evidence contracts/development/testing.md#execution-ownership Prepares polygon men; a pending specification until the emblem can state its arm.
 * @evidence contracts/development/common.md#meaningful-documentation States the source, why the file is pending with its numbers, and the 2 scenarios.
 */
export function test_human_motion_signature_salute(): void {
  const salute: IHumanActionLaw<{ hold?: number }> = {
    name: "salute",
    interrupts: {
      any: [{ window: ["relax", 1], kind: "inertialize", entry: 0 }],
    },
    plan: (context: IHumanActionContext<{ hold?: number }>): IHumanActionPlan =>
      touch.plan({
        ...context,
        params: {
          target: { kind: "self", region: "templeRight" },
          with: "fingertips",
          kind: "hold",
          side: "right",
          hold: context.params.hold ?? 1,
        },
      }),
  };
  const complaints: string[] = [];
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const performance: HumanPerformance = new HumanPerformance({
      seed: "salute",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      laws: [salute],
      composition: HumanChain.extend({ salute }).subject("a").salute().node,
    });
    const placed = performance.segments("a")[0]!;
    const instant = (event: string): number =>
      placed.start +
      (placed.plan.events.find((e): boolean => e.name === event)?.share ?? 0) *
        placed.plan.duration;
    const reader: HumanSignature.IReader = HumanSignature.of(
      performance,
      "a",
      body,
      0,
    );
    const held: number = (instant("ready") + instant("relax")) / 2;
    const shoulder: IAutoMovieVector3 = HumanSignature.joint(
      reader,
      held,
      "rightUpperArm",
    );
    const elbow: IAutoMovieVector3 = HumanSignature.joint(
      reader,
      held,
      "rightLowerArm",
    );
    const elevation: number =
      (Math.asin(
        (elbow.y - shoulder.y) /
          Math.hypot(
            elbow.x - shoulder.x,
            elbow.y - shoulder.y,
            elbow.z - shoulder.z,
          ),
      ) *
        180) /
      Math.PI;
    if (Math.abs(elevation) > 10)
      complaints.push(
        `${name}: the upper arm lies ${elevation.toFixed(1)} degrees from the horizontal at the hold, within 10 expected (TC 3-21.5)`,
      );
    if (!(elbow.z > shoulder.z))
      complaints.push(
        `${name}: the elbow lies ${((elbow.z - shoulder.z) * 1000).toFixed(0)} mm ahead of the shoulder, ahead expected (TC 3-21.5)`,
      );
  }
  TestValidator.equals("the salute's arm", complaints, []);
}
