import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanWalkSteps,
} from "@automovie/interface";
import {
  HumanChain,
  HumanFoot,
  HumanPerformance,
  walkSteps,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { nclose } from "../internal/nclose";

/**
 * A straight, externally paced walk places the ankle ahead of the pelvis
 * by half a step in double support and by half of contact in flight,
 * accounting for where the foot rolls between heel and ball.
 *
 * Scenarios:
 * 1. Swing just below or at one period leaves the footprint half a step ahead.
 * 2. Swing just above one period centres the pressure path over midstance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Specifies the contact transition and reads a flat ankle after landing.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public foot schedule on a fixed-speed straight path.
 * @evidence contracts/development/testing.md#independent-expectations At one metre per second, elapsed seconds give distance in metres. Half the contact interval locates midstance, corrected by the midpoint of the heel and ball offsets in step units.
 * @evidence contracts/development/testing.md#distinguishing-cases Swing varies by one millisecond either side of a one-second period. The nonzero foot offset distinguishes both branch results at equality.
 * @evidence contracts/development/testing.md#execution-ownership Three small public step plans share a single actor's standing entry.
 */
export function test_human_motion_pose_contract_footfall_lead(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const entry: IAutoMovieMotionHumanEntryState = new HumanPerformance({
    seed: "footfall",
    performers: [
      {
        subject: "walker",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("walker").stand({ seconds: 1, sway: 0 })
      .node,
  }).segments("walker")[0]!.context.entry;
  const start: number =
    (entry.feet.left.ankle.z + entry.feet.right.ankle.z) / 2;
  const distance: number = 10;
  const offset: number =
    (HumanFoot.offset(body, "left", "heel").z +
      HumanFoot.offset(body, "left", "mtp").z) /
    2;
  for (const swing of [0.999, 1, 1.001]) {
    const plan: IAutoMovieMotionHumanWalkSteps.IPlan = walkSteps.plan({
      body,
      entry,
      to: {
        x: (entry.feet.left.ankle.x + entry.feet.right.ankle.x) / 2,
        y: 0,
        z: start + distance,
      },
      speed: 1,
      longest: 1,
      swing,
      period: (): number => 1,
      travel: (seconds: number): number =>
        Math.max(0, Math.min(1, seconds / distance)),
    });
    const strikes = plan.events.filter((event) =>
      event.name.includes("HeelStrike"),
    );
    const landing: number = strikes.find(
      (event) => event.name === "leftHeelStrike3",
    )!.seconds;
    const step: number = distance / (strikes.length - 1);
    const contact: number = 2 - swing;
    const lead: number = swing <= 1 ? 0.5 : contact / 2 - offset / step;
    const ankle: number = plan.foot("left", landing + contact / 3).placement
      .ankle.z;
    TestValidator.predicate(
      `flat ankle after landing with swing ${swing}`,
      nclose(ankle, start + landing + lead, 1e-9),
    );
  }
}
