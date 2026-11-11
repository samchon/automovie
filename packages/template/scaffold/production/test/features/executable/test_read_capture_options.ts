import { TestValidator } from "@nestia/e2e";

import { readCaptureOptions } from "../../../src/executable/readCaptureOptions";

/**
 * Pin how the capture command reads its arguments.
 *
 * Scenarios:
 * 1. A valued option takes the next argument or the text after `=`, including a value that starts with a hyphen or holds another `=`; a flag reads as `1`.
 * 2. A repeated option keeps its last value, and no argument gives an empty map.
 * 3. An unknown option, a bare word, a valued option without a value and a flag given a value are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment lists the three scenarios and the rule each pins.
 * @evidence contracts/development/testing.md#behavioral-verification Calls readCaptureOptions on literal argument lists and asserts the whole map or the thrown refusal; a swallowed following option, a value cut at its second `=`, an ignored typo or a flag that silently stays on fails.
 * @evidence contracts/development/testing.md#independent-expectations Expected maps are written from the documented rules for the two value forms, flags and repeats, not read back from the function.
 * @evidence contracts/development/testing.md#distinguishing-cases Both value forms, a section cut whose value starts with a hyphen, a value holding `=`, a flag between valued options, a repeat, the empty list and each refusal; what an option means belongs to the capture command.
 * @evidence contracts/development/testing.md#execution-ownership A pure unit test with literal arrays, discovered by test/index.ts as an exported test_ function; it runs no command.
 */
export function test_read_capture_options(): void {
  TestValidator.equals(
    "both value forms and flags",
    [
      ...readCaptureOptions([
        "--film",
        "starter",
        "--wire",
        "--shade=clay",
        "--section",
        "-x:0.2",
        "--parts=hero/*=a",
        "--paths",
      ]),
    ],
    [
      ["--film", "starter"],
      ["--wire", "1"],
      ["--shade", "clay"],
      ["--section", "-x:0.2"],
      ["--parts", "hero/*=a"],
      ["--paths", "1"],
    ],
  );
  TestValidator.equals(
    "a repeat keeps the last value",
    [...readCaptureOptions(["--rate", "5", "--rate=10"])],
    [["--rate", "10"]],
  );
  TestValidator.equals("no argument", readCaptureOptions([]).size, 0);

  for (const [label, argv] of [
    ["unknown option", ["--flim", "starter"]],
    ["bare word", ["starter"]],
    ["missing value at the end", ["--film"]],
    ["empty inline value", ["--film="]],
    ["flag given a value", ["--wire=0"]],
  ] as const)
    TestValidator.error(label, (): unknown => readCaptureOptions(argv));
}
