import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import type { CaptureDirectory } from "../../../src/executable/CaptureDirectory";
import type { CaptureSheetBook } from "../../../src/executable/CaptureSheetBook";
import { admitCaptureLayout } from "../../../src/executable/admitCaptureLayout";

/**
 * Pin which capture layouts are admitted and where an admitted run writes.
 *
 * Scenarios:
 * 1. A run without a round writes into the base folder and a kept round into `rounds/<name>` beneath it; a compared run names the compared round's folder and a run without a comparison names none.
 * 2. A layout with sheets gets a sheet book and a layout without sheets none.
 * 3. A malformed round name, a round compared against itself, a tolerance that is negative or not finite, and a sheet layout its book refuses are refused.
 * 4. The nearest layouts are admitted: a round compared against another, and a positive tolerance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment lists the four scenarios and what each pins.
 * @evidence contracts/development/testing.md#behavioral-verification Calls admitCaptureLayout and asserts the resolved folders, whether a sheet book is made, and each refusal; a round written outside its folder, a comparison against the wrong folder, a book made for a run without sheets, a missed refusal or a refusal of a layout at its limit fails.
 * @evidence contracts/development/testing.md#independent-expectations Folders follow the documented `<base>/rounds/<name>` form written with the platform's separator, and each refused value is one the documented rule names.
 * @evidence contracts/development/testing.md#distinguishing-cases A run with and without a round, with and without a comparison, with and without sheets, each refusal once with the three tolerances that are not a non-negative number, and beside the refusals the nearest admitted layout; which sheet layouts a book refuses is test_capture_sheet_book's, and whether the compared round exists is read from the folder by the folder owner.
 * @evidence contracts/development/testing.md#execution-ownership A pure unit test with literal layouts, discovered by test/index.ts as an exported test_ function; it reads and writes no file.
 */
export function test_admit_capture_layout(): void {
  const base: string = path.join("media", "capture");
  const layout = (
    overrides: Partial<CaptureDirectory.ILayout>,
  ): CaptureDirectory.ILayout => ({
    base,
    round: undefined,
    compare: undefined,
    tolerance: 0,
    sheet: null,
    ...overrides,
  });
  const sheet = (
    perSheet: number,
    columns: number,
  ): CaptureSheetBook.ILayout => ({
    perSheet,
    columns,
    views: 1,
    raster: undefined,
  });

  // 1. Where a run writes and what it is compared against.
  const plain: ReturnType<typeof admitCaptureLayout> = admitCaptureLayout(
    layout({}),
  );
  TestValidator.equals(
    "a run without a round writes into the base",
    plain.directory,
    base,
  );
  TestValidator.predicate(
    "a run without a comparison names no round",
    plain.reference === undefined,
  );
  const kept: ReturnType<typeof admitCaptureLayout> = admitCaptureLayout(
    layout({ round: "before", compare: "v1.2_a-b" }),
  );
  TestValidator.equals(
    "a round has its own folder",
    kept.directory,
    path.join(base, "rounds", "before"),
  );
  TestValidator.equals(
    "the compared round's folder",
    kept.reference,
    path.join(base, "rounds", "v1.2_a-b"),
  );

  // 2. A sheet book only for a run with sheets.
  TestValidator.predicate(
    "a run without sheets has no sheet book",
    plain.sheets === undefined,
  );
  TestValidator.predicate(
    "a run with sheets has one",
    admitCaptureLayout(layout({ sheet: sheet(2, 1) })).sheets !== undefined,
  );

  // 3. Refusals.
  for (const [label, refused] of [
    ["round outside the folder", { round: "../before" }],
    ["round with a space", { round: "be fore" }],
    ["compared round with a separator", { compare: "rounds/before" }],
    ["round compared against itself", { round: "x", compare: "x" }],
    ["negative tolerance", { tolerance: -1 }],
    ["undefined tolerance", { tolerance: Number.NaN }],
    ["unbounded tolerance", { tolerance: Number.POSITIVE_INFINITY }],
    ["sheet layout its book refuses", { sheet: sheet(0, 2) }],
  ] as const)
    TestValidator.error(
      label,
      (): ReturnType<typeof admitCaptureLayout> =>
        admitCaptureLayout(layout(refused)),
    );

  // 4. The nearest admitted layouts.
  for (const [label, admitted, directory] of [
    [
      "round compared against another",
      { round: "x", compare: "y" },
      path.join(base, "rounds", "x"),
    ],
    ["positive tolerance", { tolerance: 40 }, base],
  ] as const)
    TestValidator.equals(
      label,
      admitCaptureLayout(layout(admitted)).directory,
      directory,
    );
}
