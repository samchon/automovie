import {
  HumanArmSeedRestarts
} from "../../../../../packages/motions/src/posture/internal/HumanArmSeedRestarts";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * Roundoff for the first points. The unit-scale radical inverses and the
 * polar conversion are scaled by at most 100 coordinate units. Six rounded
 * operations and the trigonometric evaluation allow eight units of roundoff
 * at that scale.
 */
const ROUNDING: number = 8 * 100 * Number.EPSILON;

/**
 * Each arm receives its own Halton bases. The first radical inverse is
 * 1 / base. Boxed coordinates take it directly and the chart pair takes the
 * polar coordinates of a unit-square sample, scaled by the chart radius.
 *
 * Scenarios:
 *
 * 1. The first shoulder chart pairs use bases 29, 31 and 73, 79. The
 *    boxed coordinates use base 5 for the first arm and 43 for the second.
 * 2. Both arms keep locked coordinates fixed and the sampler delivers the
 *    promised number of deterministic starts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes separate Halton bases per arm, chart mapping, locked joints and restart budget.
 * @evidence contracts/development/testing.md#behavioral-verification Enumerates deterministic starts for two typed arms with chart discs, bounded coordinates and locks.
 * @evidence contracts/development/testing.md#independent-expectations First radical inverses are 1/base for explicit bases 29/31 and 73/79; direct bounds and polar coordinates constrain every sample.
 */
export function test_motions_posture_arm_seed_restarts(): void {
  const rest: number[] = [0, 0, 0, 7, 0, 0, 0, 0, 0];
  const bounds: Parameters<typeof HumanArmSeedRestarts>[0]["bounds"][number] = [
    null,
    null,
    [0, 1],
    null,
    null,
    null,
    null,
    null,
    null,
  ];
  const c: Parameters<typeof HumanArmSeedRestarts>[0] = {
    rest: [rest, rest],
    back: [rest, rest],
    bounds: [bounds, bounds],
    free: [[0, 1, 2], [0, 1, 2]],
  };
  const starts: number[][][] = [...HumanArmSeedRestarts(c)];
  const expected = (radius: number, angle: number, box: number): number[] => [
    (100 * Math.cos((2 * Math.PI) / angle)) / Math.sqrt(radius),
    (100 * Math.sin((2 * Math.PI) / angle)) / Math.sqrt(radius),
    1 / box,
  ];
  TestValidator.predicate(
    "the first two independent Halton chart points",
    [expected(29, 31, 5), expected(73, 79, 43)].every(
      (arm: number[], a: number): boolean =>
        arm.every((v: number, d: number): boolean =>
          nclose(starts[0]![a]![d]!, v, ROUNDING),
        ),
    ),
  );
  TestValidator.equals("the measured restart budget", starts.length, 80);
  TestValidator.predicate(
    "every restart lies within the chart and keeps its locked joints",
    starts.every((restart: number[][]): boolean =>
      restart.every(
        (arm: number[]): boolean =>
          Math.hypot(arm[0]!, arm[1]!) <= 100 + ROUNDING &&
          arm[2]! >= 0 &&
          arm[2]! <= 1 &&
          arm.slice(3).every((v: number, d: number): boolean => v === rest[d + 3]),
      ),
    ),
  );
}
