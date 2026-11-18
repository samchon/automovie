import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A heading is an angle, so a body facing 270 degrees is the body facing
 * -90: getting down onto the hands and knees from either shows the same
 * motion, the feet rolling onto their toes where they stood without turning
 * about. A roll that blends the foot's heading the long way round spins the
 * foot almost a whole turn on the way down when the yaw is written past 180.
 *
 * Scenarios:
 * on the average man, crawling one cycle from standing, read at
 * 24 frames a second from the start to `down`:
 * 1. Facing 270 and facing -90 the left and right toe and foot joints stand
 *    within a millimetre of each other at every frame.
 * 2. Facing 90 and facing -270, the same.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the crawl through the public chain at two writings of each heading and compares the displayed toe and foot joints over the way down; a foot whose roll turns by the written yaw rather than the angle it names fails with the joint, the distance and the second.
 * @evidence contracts/development/testing.md#independent-expectations The expectation is the identity of an angle and that angle plus a whole turn, which holds for any correct law; the millimetre is a rounding bound far under any visible turn of a foot.
 * @evidence contracts/development/testing.md#distinguishing-cases Two headings, each written below and past the half turn, so both directions of the wrap are read; the yaw 0 crawl of the crawl-down spec is the case that needs no wrap.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds four performances in memory, reading their displayed bones.
 * @evidence contracts/development/common.md#meaningful-documentation States the relation, the two scenarios and the bound.
 */
export function test_motion_posture_floor_travel(): void {
  const complaints: string[] = [];
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const perform: (yaw: number) => IAutoMovieMotionHumanPerformance = (
    yaw: number,
  ): IAutoMovieMotionHumanPerformance =>
    new HumanPerformance({
      seed: "crawl-heading",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a").crawl({ kind: "knees", cycles: 1 })
        .node,
    });
  for (const [written, named] of [
    [270, -90],
    [90, -270],
  ] as const) {
    const a: IAutoMovieMotionHumanPerformance = perform(written);
    const b: IAutoMovieMotionHumanPerformance = perform(named);
    const [crawl]: readonly IAutoMovieMotionHumanSegment[] = a.segments("a");
    const down: number =
      crawl!.start +
      (crawl!.plan.events.find(
        (e: { name: string }): boolean => e.name === "down",
      )?.share ?? 0) *
        crawl!.plan.duration;
    let worst: { distance: number; seconds: number; bone: string } = {
      distance: 0,
      seconds: 0,
      bone: "none",
    };
    for (let t: number = 0; t <= down; t += 1 / 24)
      for (const bone of [
        "leftFoot",
        "rightFoot",
        "leftToes",
        "rightToes",
      ] as const) {
        const p: IAutoMovieVector3 | undefined = a
          .bones("a", t)
          .get(bone)?.worldPosition;
        const q: IAutoMovieVector3 | undefined = b
          .bones("a", t)
          .get(bone)?.worldPosition;
        if (p === undefined || q === undefined) continue;
        const distance: number = Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
        if (distance > worst.distance) worst = { distance, seconds: t, bone };
      }
    if (worst.distance > 1e-3)
      complaints.push(
        `yaw ${written} against ${named}: ${worst.bone} ${(worst.distance * 1000).toFixed(1)} mm apart at ${worst.seconds.toFixed(2)} s`,
      );
  }
  TestValidator.equals(
    "a crawl's way down is the same at either writing of its heading",
    complaints,
    [],
  );
}
