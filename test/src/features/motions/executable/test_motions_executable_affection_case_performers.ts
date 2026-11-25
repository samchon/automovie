import { affectionCasePerformers } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `affectionCasePerformers` stands `a` at the origin heading +Z and `b` the gap
 * ahead, turned half round to face `a` or heading the same way, both trained
 * and carrying the given body.
 *
 * Scenarios:
 *
 * 1. Facing at 0.55 m: `b` at (0, 0, 0.55) heading 180 degrees.
 * 2. Turned away at 0.45 m: `b` heading 0 degrees.
 */
export function test_motions_executable_affection_case_performers(): void {
  TestValidator.equals("facing", affectionCasePerformers("body", true, 0.55), [
    {
      subject: "a",
      body: "body",
      at: { x: 0, y: 0, z: 0 },
      yaw: 0,
      proficiency: { level: "trained" },
    },
    {
      subject: "b",
      body: "body",
      at: { x: 0, y: 0, z: 0.55 },
      yaw: 180,
      proficiency: { level: "trained" },
    },
  ]);
  TestValidator.equals(
    "turned away",
    affectionCasePerformers("body", false, 0.45)[1]!.yaw,
    0,
  );
}
