import { TestValidator } from "@nestia/e2e";

import { isCaptureOwnedFile } from "../../../src/executable/isCaptureOwnedFile";

/**
 * Pin which file names the next capture run in a folder replaces.
 *
 * Scenarios:
 * 1. Every file a run writes is owned: a still with and without a view, a numbered video frame, a numbered decoded still, a sheet and its index, a difference image of each kind of still, the manifest and the comparison record.
 * 2. The `rounds` folder, a reader's own file, a name that only contains an owned form and a name that only starts like a sheet or a difference image are not owned.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment lists the two scenarios and what each pins.
 * @evidence contracts/development/testing.md#behavioral-verification Calls isCaptureOwnedFile on each name and asserts the answer; a run that left a stale still, sheet or difference image behind, or one that deleted a kept round, a note, a renamed copy or a reader's own `sheet-` or `diff-` file, fails.
 * @evidence contracts/development/testing.md#independent-expectations The owned names are the forms the capture command documents, `t<seconds>[-<view>].png`, `f<number>.png` and `s<number>.png` with the number padded to five digits, `sheet-<seconds>-<seconds>.png` and `diff-<still>`, written by hand, and the others are names the command never writes.
 * @evidence contracts/development/testing.md#distinguishing-cases A still below and past a thousand seconds, a view id with a hyphen, each owned form once, a numbered frame and still below and past the 99999th, and beside them the nearest names that are not owned: a still with a suffix or a prefix, a second without decimals, a frame number of four digits and one padded to six, a manifest with a suffix, a view id with a space, a sheet named after words, after one second or with a suffix, and a difference image of something that is not a still.
 * @evidence contracts/development/testing.md#execution-ownership A pure unit test with literal names, discovered by test/index.ts as an exported test_ function.
 */
export function test_is_capture_owned_file(): void {
  for (const name of [
    "t000.000.png",
    "t1234.500.png",
    "t000.200-front.png",
    "t000.200-three-quarter.png",
    "f00012.png",
    "f100000.png",
    "s00000.png",
    "s123456.png",
    "sheet-000.000-009.800.png",
    "sheet-000.000-009.800.png.json",
    "diff-t000.200.png",
    "diff-t000.200-front.png",
    "diff-f00012.png",
    "diff-s00000.png",
    "manifest.json",
    "comparison.json",
  ])
    TestValidator.equals(`${name} is replaced`, isCaptureOwnedFile(name), true);

  for (const name of [
    "rounds",
    "notes.txt",
    "t000.200.png.bak",
    "copy-of-t000.200.png",
    "t000.png",
    "t000.200-front view.png",
    "f0012.png",
    "f000012.png",
    "sheet.png",
    "sheet-notes.png",
    "sheet-000.000.png",
    "sheet-000.000-009.800 copy.png",
    "sheet-000.000-009.800.png.json.bak",
    "diff-old.png",
    "diff-t000.200.png.bak",
    "diff-sheet-000.000-009.800.png",
    "manifest.json.old",
    "comparison.txt",
  ])
    TestValidator.equals(`${name} is kept`, isCaptureOwnedFile(name), false);
}
