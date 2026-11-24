import type { IAutoMovieMotionHumanSegment } from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * An extended lying hold begins at the down event without changing the fall.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the native reaction, the comparison clock and the authored hold.
 * @evidence contracts/development/testing.md#behavioral-verification Compares the raw and displayed hold at the down event, an interior time and the new end.
 * @evidence contracts/development/testing.md#independent-expectations A zero-length hold ends in the same supine posture that an extended hold preserves.
 * @evidence contracts/development/testing.md#distinguishing-cases The otherwise identical control ends as soon as the back reaches the floor.
 * @evidence contracts/development/testing.md#execution-ownership Uses two public performances and samples both independent readers.
 */
export function test_motion_fall_knockdown_hold(): void {
  const film = (seconds: number): HumanPerformance =>
    new HumanPerformance({
      seed: "knockdown-hold",
      performers: [
        {
          subject: "actor",
          body: motionHumanBody("m-average"),
          at: { x: 0.4, y: 0, z: -0.7 },
          yaw: 27,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("actor").knockdown({ hold: seconds })
        .node,
    });
  const control: HumanPerformance = film(0);
  const held: HumanPerformance = film(2);
  const segment: IAutoMovieMotionHumanSegment = held.segments("actor").at(-1)!;
  const down: number = control.duration;
  for (const at of [held.duration, down, down + 0.67]) {
    TestValidator.equals(
      "the hold leaves the grounded pose unchanged",
      held.pose("actor", at),
      control.pose("actor", down),
    );
    TestValidator.equals(
      "the hold keeps the raw authored posture",
      held.posture("actor", at),
      control.posture("actor", down),
    );
  }
  TestValidator.predicate(
    "the hold follows its physical landing",
    segment.plan.physicalWindow?.to === down - segment.start,
  );
}
