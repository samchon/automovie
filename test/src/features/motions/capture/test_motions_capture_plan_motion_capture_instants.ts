import {
  planMotionCaptureInstants
} from "../../../../../packages/motions/src/capture/internal/planMotionCaptureInstants";
import { TestValidator } from "@nestia/e2e";

/**
 * Check grouping and labelling of capture instants at millisecond precision.
 *
 * Scenarios:
 *
 * 1. Keep the authored start and end at 0 and 1.25 s. Group 0.5, 0.5002 and
 *    0.5001 s into a still at 0.5 s.
 * 2. Keep `grip / release` in declaration order and include the repeated grip
 *    label once.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases specify tick precision, representative second and label order.
 * @evidence contracts/development/testing.md#behavioral-verification The capture planner receives five flat inputs and is compared with three precise output records.
 * @evidence contracts/development/testing.md#independent-expectations The three middle values share the same millisecond and their first distinct labels determine the expected text.
 */
export function test_motions_capture_plan_motion_capture_instants(): void {
  TestValidator.equals(
    "the instants",
    planMotionCaptureInstants([
      { seconds: 0, label: "start" },
      { seconds: 0.5, label: "grip" },
      { seconds: 0.5002, label: "release" },
      { seconds: 0.5001, label: "grip" },
      { seconds: 1.25, label: "end" },
    ]),
    [
      { seconds: 0, label: "start" },
      { seconds: 0.5, label: "grip / release" },
      { seconds: 1.25, label: "end" },
    ],
  );
}
