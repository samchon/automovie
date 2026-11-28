import { AutoMovieEngineVector3 } from "@automovie/engine";
import { AutoMovieMotionHumanChain, AutoMovieMotionHumanPerformance } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";

/**
 * A backward walk keeps the swing ankle inside the leg's reach while the
 * departing sole anchor fades out. Sample the early swing after each toe-off.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The backward walk keeps its ankle within leg reach during early swing as its sole contact fades.
 * @evidence contracts/development/testing.md#behavioral-verification Plays a stock backward walk and samples the ankle after each declared toe-off, comparing it with the active limb goal.
 * @evidence contracts/development/testing.md#independent-expectations The 2 mm distance bound directly compares displayed ankle and goal at the tested instants and would fail if the departing foot retained an unreachable target.
 */
export async function test_motions_actions_walk_reverse_reach(): Promise<void> {
  const body = await humanFixtureBody("m-average");
  const performance = new AutoMovieMotionHumanPerformance({
    seed: "walk",
    performers: [
      {
        subject: "w0",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: AutoMovieMotionHumanChain.subject("w0").walk({
      to: { x: 0, y: 0, z: -4 },
      via: [{ x: 0, y: 0, z: -1.5 }],
      facing: { yaw: 0 },
      face: 0,
      stride: 0.9,
      armSwing: 1.5,
      elbows: 10,
    }).node,
  });
  const segment = performance.segments("w0")[0]!;
  for (const event of segment.plan.events) {
    if (!event.name.includes("ToeOff")) continue;
    const side = event.name.startsWith("left") ? "left" : "right";
    const off = segment.start + event.share * segment.plan.duration;
    for (const delay of [0.025, 0.05, 0.075]) {
      const seconds = off + delay;
      const goal = performance.posture("w0", seconds).limbs[`${side}Leg`]!;
      const ankle = performance
        .bones("w0", seconds)
        .get(`${side}Foot`)!.worldPosition;
      const miss = AutoMovieEngineVector3.distance(goal.point, ankle);
      TestValidator.predicate(
        `${event.name} keeps the ankle within 2 mm at ${delay} s (miss ${miss} m)`,
        miss <= 0.002,
      );
    }
  }
}
