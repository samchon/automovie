import { TestValidator } from "@nestia/e2e";

import { formatCaptureSeconds } from "../../../src/executable/formatCaptureSeconds";

/**
 * Pin the text a film second takes in capture file and folder names.
 *
 * Scenarios:
 * 1. Seconds are written to the millisecond and padded to seven characters, and a film past a thousand seconds grows instead of being cut.
 * 2. Names of rising seconds below a thousand sort in rising order as text.
 * 3. A negative, infinite or undefined second is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment lists the three scenarios and the rule each pins.
 * @evidence contracts/development/testing.md#behavioral-verification Calls formatCaptureSeconds and asserts the exact text, the text order of a rising series and the refusals; lost padding, a dropped millisecond or a name for an impossible second fails.
 * @evidence contracts/development/testing.md#independent-expectations Expected texts are the documented form written by hand, and the order check compares against the numeric order of the inputs.
 * @evidence contracts/development/testing.md#distinguishing-cases Zero, a frame of a 30 fps film, a second just under and over the padded width, a sorted series crossing ten and a hundred seconds up to the last millisecond below a thousand, and three refused inputs.
 * @evidence contracts/development/testing.md#execution-ownership A pure unit test with literal numbers, discovered by test/index.ts as an exported test_ function.
 */
export function test_format_capture_seconds(): void {
  for (const [seconds, text] of [
    [0, "000.000"],
    [2.4, "002.400"],
    [1 / 30, "000.033"],
    [999.9994, "999.999"],
    [1234.5, "1234.500"],
  ] as const)
    TestValidator.equals(`${seconds} s`, formatCaptureSeconds(seconds), text);

  const rising: number[] = [
    0, 0.2, 2, 9.8, 10, 10.2, 99.8, 100, 250.4, 999.999,
  ];
  const names: string[] = rising.map(formatCaptureSeconds);
  TestValidator.equals(
    "text order is time order",
    [...names].sort((a: string, b: string): number =>
      a < b ? -1 : a > b ? 1 : 0,
    ),
    names,
  );

  for (const seconds of [-0.1, Number.POSITIVE_INFINITY, Number.NaN])
    TestValidator.error(`${seconds} s`, (): string =>
      formatCaptureSeconds(seconds),
    );
}
