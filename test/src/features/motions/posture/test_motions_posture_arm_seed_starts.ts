import {
  HumanArmSeedStarts
} from "../../../../../packages/motions/src/posture/internal/HumanArmSeedStarts";
import { TestValidator } from "@nestia/e2e";

/**
 * `HumanArmSeedStarts`, the seeds a hold instant's inverse kinematics tries in
 * turn: the caller's configuration, the law's goal arms, the rest, each a fresh
 * copy, so one deterministic attempt from each is made in that order.
 *
 * Scenarios:
 *
 * 1. With all three, the order is given, guesses, rest.
 * 2. Without a given configuration or goal arms, the rest alone.
 * 3. Each start is a copy: writing one leaves its source as it was.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines order and copy ownership for caller, goal and rest configurations.
 * @evidence contracts/development/testing.md#behavioral-verification Enumerates starts with all sources and with only rest, then mutates one result.
 * @evidence contracts/development/testing.md#independent-expectations Declared ordering gives caller, guessed and rest configurations. Missing entries leave rest only, and result mutation leaves every source unchanged.
 */
export function test_motions_posture_arm_seed_starts(): void {
  const given: number[][] = [[1, 2, 3]];
  const guesses: number[][] = [[4, 5, 6]];
  const rest: number[][] = [[0, 0, 0]];
  const all: number[][][] = HumanArmSeedStarts(given, guesses, rest);
  TestValidator.equals("given, guesses, rest", all, [given, guesses, rest]);
  TestValidator.equals(
    "the rest alone",
    HumanArmSeedStarts(undefined, undefined, rest),
    [rest],
  );
  all[0]![0]![0] = 9;
  all[2]![0]![0] = 9;
  TestValidator.equals("copies", [given, rest], [[[1, 2, 3]], [[0, 0, 0]]]);
}
