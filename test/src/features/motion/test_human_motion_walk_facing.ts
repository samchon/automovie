import { TestValidator } from "@nestia/e2e";

import { motionWalkFacing } from "../internal/motionWalkFacing";

/**
 * The requested heading stays distinct from the path, and an implicit
 * heading first turns the body into its walk. Both stature fixtures keep
 * every path and bound described by `motionWalkFacing`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the two heading modes and the shared scenario owner.
 * @evidence contracts/development/testing.md#behavioral-verification Stages the fixed-heading backpedal and side-walk, point-facing arc and implicit turns through the public chain. Compares displayed headings, foot plants, arrival, height, crossing and duration with the established bounds.
 * @evidence contracts/development/testing.md#independent-expectations Heading follows the authored vector or point independently. Cited backward-walking speed and the straight walk's height provide the duration and height baselines.
 * @evidence contracts/development/testing.md#distinguishing-cases Retains both prior body fixtures, each path, a quarter and half turn and both lengths of the straight baseline.
 * @evidence contracts/development/testing.md#execution-ownership One discovered in-memory spec builds each requested performance and each distinct straight baseline once per body.
 */
export function test_human_motion_walk_facing(): void {
  const findings: string[] = [];
  for (const name of ["f-small", "m-average"] as const)
    motionWalkFacing(name, findings);
  TestValidator.equals(
    "a walk obeys its heading and plant contracts",
    findings,
    [],
  );
}
