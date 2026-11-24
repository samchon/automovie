import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * The displayed palm wipes a horizontal circle at the original stroke timing.
 *
 * Scenarios:
 * 1. Sample the stroke ends, midpoint and two interior times in reverse order.
 * 2. Read the midpoint again and bound deviation from the authored circle.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the displayed palm, floor-frame circle, local phase and spatial bound.
 * @evidence contracts/development/testing.md#behavioral-verification The actual displayed palm passes five places of the planted stroke and repeats its midpoint consistently.
 * @evidence contracts/development/testing.md#independent-expectations The scene supplies a world plane and the circle radius is a quarter forearm. A palm off that ring by more than the existing 10 mm arm target tolerance fails.
 * @evidence contracts/development/testing.md#distinguishing-cases Out-of-order samples include both phase boundaries and interior reads that use the prepared contact stroke.
 * @evidence contracts/development/testing.md#execution-ownership One polygon man, one placed wipe and six displayed bone samples run in the motion suite.
 */
export function test_motion_operate_task_wipe_circle(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const centre: IAutoMovieVector3 = {
    x: -0.15,
    y: body.measure.shoulderHeight - body.measure.upperArm - 0.225,
    z: 0.4,
  };
  const film: HumanPerformance = new HumanPerformance({
    seed: "wipe-circle",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a").act("wipe", {
      on: { kind: "point", frame: "world", at: centre },
      count: 1,
    }).node,
  });
  const segment: IAutoMovieMotionHumanSegment = film.segments("a")[0]!;
  const radius: number = body.measure.forearm / 4;
  const event = (name: string): number =>
    segment.start +
    segment.plan.events.find((mark) => mark.name === name)!.share *
      segment.plan.duration;
  const start: number = event("strokeStart");
  const end: number = event("strokeEnd");
  let midpoint: IAutoMovieVector3 | undefined;
  for (const share of [1, 0.75, 0.5, 0.25, 0, 0.5]) {
    const palm: IAutoMovieVector3 = HumanHand.frame(
      body,
      film.bones("a", start + share * (end - start)),
      "right",
      "palm",
      "flat",
    ).point;
    const radial: number = Math.hypot(palm.x - centre.x, palm.z - centre.z);
    const miss: number = Math.hypot(radial - radius, palm.y - centre.y);
    TestValidator.predicate(
      `palm at share ${share} is within 10 mm of the circle (${1000 * miss} mm)`,
      miss <= 0.01,
    );
    if (share === 0.5) {
      if (midpoint !== undefined)
        TestValidator.predicate(
          "the repeated midpoint agrees within 1 nm",
          Vector3.length(Vector3.subtract(palm, midpoint)) <= 1e-9,
        );
      midpoint = palm;
    }
  }
}
