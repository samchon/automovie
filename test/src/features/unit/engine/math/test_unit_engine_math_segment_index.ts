import { segmentIndex } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `segmentIndex` finds the segment straddling a time, an exact interior key
 * belonging to the segment that ends at it.
 *
 * Scenarios:
 *
 * Keys at 0, 1, 2, 3:
 *
 * 1. Times 0.5, 1.5 and 2.5 fall in segments 0, 1 and 2.
 * 2. Times 1 and 2 hit interior keys and resolve to segments 0 and 1.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls segmentIndex with times inside segments and on interior keys and asserts the lower index.
 * @evidence contracts/development/testing.md#independent-expectations The documented tie rule (a hit on key k gives k - 1) and the key positions give each index by hand.
 * @evidence contracts/development/testing.md#distinguishing-cases Inside a segment versus exactly on a key are the adjacent cases; the ends are the caller premise and are not called.
 * @evidence contracts/development/testing.md#execution-ownership The named test_unit_engine_math_segment_index entry runs portable in-memory literals with no host and no dynamically registered cases.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_unit_engine_math_segment_index(): void {
  const keys: number[] = [0, 1, 2, 3];
  const at = (index: number): number => keys[index]!;
  for (const [time, expected] of [
    [0.5, 0],
    [1.5, 1],
    [2.5, 2],
    [1, 0],
    [2, 1],
  ] as const)
    TestValidator.equals(`time ${time}`, segmentIndex(4, at, time), expected);
}
