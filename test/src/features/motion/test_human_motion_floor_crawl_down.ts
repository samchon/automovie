import type { IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPerformance, IAutoMovieMotionHumanSegment } from "@automovie/interface";
import { physicalShapeBounds } from "@automovie/engine";
import { AutoMovieMotionHumanAudit, HumanChain, HumanColliders, HumanPerformance, HumanVerdicts } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Getting down from standing onto the hands and the knees, or onto the hands
 * and the feet, is a body the supports take in turn: the feet stay where they
 * stood and roll onto their toes, the knees and then the hands land, and
 * nothing slides, sinks or snaps on the way.
 *
 * Scenarios, the average man and the small woman, each crawling one cycle
 * from standing, on hands and knees and as a bear crawl, over the way down
 * from the start to `down`, read at 24 frames a second:
 * 1. The motion verdicts (`HumanVerdicts`) report no finding other than the
 *    floor's: no foot skating along the floor, no bone turning by a snap, no
 *    body part inside another, no joint jumping.
 * 2. No collider other than the hands' sinks below the floor by more than
 *    the verdicts' floor limit (`AutoMovieMotionHumanAudit.LIMITS.floor`).
 *    A hand laid flat on the floor, its palm and its digits, is the hand
 *    contact's, which solves it onto the surface, and is read by its own
 *    spec.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs both crawls from standing through the public chain and reads the verdicts and the placed colliders over the way down; feet dragged to the crawl's place, toes sunk through the floor or an arm that snaps as it reaches for the floor fail with the check, the value, the second and the part.
 * @evidence contracts/development/testing.md#independent-expectations The verdicts' own limits judge the motion; nothing is read off the law's goals.
 * @evidence contracts/development/testing.md#distinguishing-cases The crawl on the knees and the bear crawl, on two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds four performances in memory, reading the verdicts and the colliders of each over its way down.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the two scenarios with their limits' source and why the hands are left to their own spec.
 */
export function test_human_motion_floor_crawl_down(): void {
  const complaints: string[] = [];
  const RATE: number = 24;
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    for (const kind of ["knees", "bear"] as const) {
      const performance: IAutoMovieMotionHumanPerformance = new HumanPerformance({
        seed: "crawl-down",
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a").crawl({ kind, cycles: 1 }).node,
      });
      const [crawl]: readonly IAutoMovieMotionHumanSegment.ISegment[] =
        performance.segments("a");
      const down: number =
        crawl!.start +
        (crawl!.plan.events.find(
          (e: { name: string }): boolean => e.name === "down",
        )?.share ?? 0) *
          crawl!.plan.duration;

      // 1. The verdicts but the floor's.
      for (const finding of HumanVerdicts.of(performance, RATE, {
        from: 0,
        to: down,
      }).findings)
        if (finding.check !== "floor")
          complaints.push(
            `${name} ${kind}: ${finding.check} ${finding.value.toFixed(4)} over ${finding.limit} at ${finding.seconds.toFixed(2)} s (${finding.where})`,
          );

      // 2. The colliders but the hands' over the floor.
      let deepest: { depth: number; seconds: number; bone: string } = {
        depth: 0,
        seconds: 0,
        bone: "none",
      };
      for (let t: number = 0; t <= down; t += 1 / RATE)
        for (const { bone, pose, shapes } of HumanColliders.placed(
          body,
          performance.bones("a", t),
        )) {
          if (/Hand$|Thumb|Index|Middle|Ring|Little/.test(bone)) continue;
          for (const shape of shapes) {
            const depth: number = -physicalShapeBounds(pose, shape).min.y;
            if (depth > deepest.depth) deepest = { depth, seconds: t, bone };
          }
        }
      if (deepest.depth > AutoMovieMotionHumanAudit.LIMITS.floor)
        complaints.push(
          `${name} ${kind}: ${deepest.bone} ${(deepest.depth * 1000).toFixed(1)} mm below the floor at ${deepest.seconds.toFixed(2)} s`,
        );
    }
  }
  TestValidator.equals("the way down onto the floor is clean", complaints, []);
}
