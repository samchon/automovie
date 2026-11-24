import { createBall } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import { HumanChain, HumanObject, HumanPerformance } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";

/**
 * A person's last action holds its final pose to the film's end: read past
 * that action's end, the body shows the pose the action ended on, not its
 * plan read beyond its own duration.
 *
 * Scenarios:
 * 1. The average man picks a ball up from a table and puts it down beside
 *    it, his last action; every bone read a quarter second after the put
 *    down's end lies where it lay at that end, within a micrometre, and the
 *    film's own end reads the same pose.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the scenario and the bound.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed bones of the performance after and at the last action's end.
 * @evidence contracts/development/testing.md#independent-expectations The expected pose is the performance's own at the action's end; the bound is a micrometre, far below any visible step.
 * @evidence contracts/development/testing.md#distinguishing-cases A put down, whose plan read past its end leaves its course, against the held final pose.
 * @evidence contracts/development/testing.md#execution-ownership One in-memory performance of one polygon man and one ball.
 */
export function test_motion_mechanism_segment_final_pose_holds(): void {
  const performance: HumanPerformance = new HumanPerformance({
    seed: "segment-final-pose-holds",
    performers: [
      {
        subject: "a",
        body: motionHumanBody("m-average"),
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    props: [
      HumanObject.prop("ball", createBall({ kind: "tennis" }), {
        position: { x: -0.25, y: 0.9, z: 0.45 },
        rotation: Quaternion.identity(),
      }),
    ],
    composition: HumanChain.subject("a")
      .pickUp({ prop: "ball", handle: "grip" })
      .putDown({ prop: "ball", to: { x: -0.1, y: 0.9, z: 0.45 } }).node,
  });
  const last = performance.segments("a").at(-1)!;
  const end: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    performance.bones("a", last.end);
  for (const seconds of [last.end + 0.25, performance.duration]) {
    const after: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      performance.bones("a", seconds);
    let worst: number = 0;
    for (const [bone, placed] of end)
      worst = Math.max(
        worst,
        Vector3.distance(placed.worldPosition, after.get(bone)!.worldPosition),
      );
    TestValidator.predicate(
      `the final pose holds at ${seconds.toFixed(4)} s (${(worst * 1000).toFixed(3)} mm)`,
      worst <= 1e-6,
    );
  }
}
