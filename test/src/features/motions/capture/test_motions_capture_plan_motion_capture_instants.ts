import { planMotionCaptureInstants } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `planMotionCaptureInstants` names each instant a capture draws by its case's
 * label, one per second written to the millisecond: instants within one
 * millisecond are one still at the first second listed, named by their distinct
 * labels joined with `/`, in the case's order.
 *
 * Scenarios:
 *
 * 1. Distinct instants keep their seconds and labels, in order.
 * 2. Two labels within a millisecond are one still at the first second.
 * 3. A label repeated at the same millisecond is named once.
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
