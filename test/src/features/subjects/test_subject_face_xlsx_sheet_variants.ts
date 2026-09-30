import { TestValidator } from "@nestia/e2e";

import { readXlsxSheet } from "../../../scripts/face-review/readXlsxSheet";
import { createXlsxFixture } from "../internal/createXlsxFixture";
import { throwsError } from "../internal/predicates";

const base = {
  sheet: "Data",
  rows: { 1: [["A1", "n", 1]] } as Parameters<
    typeof createXlsxFixture
  >[0]["rows"],
  shared: [],
};

/** Offset of the ZIP central directory of a fixture archive. */
const directory = (bytes: Uint8Array): number =>
  Buffer.from(bytes).readUInt32LE(bytes.length - 22 + 16);

/**
 * The workbook reader's variants and refusals.
 *
 * Scenarios:
 * 1. A formula string is text, a value-less cell is `null` (a self-closing
 *    cell, the branch beside a valued one), an absolute sheet target and a
 *    workbook with no shared-string table both resolve.
 * 2. A boolean cell and an error cell refuse, naming the cell (no table this
 *    package reads holds one).
 * 3. A missing part, a sheet with no relation, a compression other than stored
 *    or deflate and a damaged central directory each refuse.
 */
export const test_subject_face_xlsx_sheet_variants = (): void => {
  const rows = readXlsxSheet(
    createXlsxFixture({
      ...base,
      rows: {
        1: [
          ["A1", "str", "a &amp; b"],
          ["B1", "empty", 0],
        ],
      },
      absoluteTarget: true,
      omit: ["xl/sharedStrings.xml"],
    }),
    "Data",
  );
  TestValidator.equals("formula string and empty cell", rows, [["a & b", null]]);
  TestValidator.predicate(
    "boolean and error cells",
    throwsError(
      () =>
        readXlsxSheet(
          createXlsxFixture({ ...base, rows: { 1: [["C1", "b", 1]] } }),
          "Data",
        ),
      "C1 holds a b",
    ) &&
      throwsError(
        () =>
          readXlsxSheet(
            createXlsxFixture({ ...base, rows: { 1: [["D2", "e", "#N/A"]] } }),
            "Data",
          ),
        "D2 holds a e",
      ),
  );
  const damaged = createXlsxFixture(base).slice();
  damaged[directory(damaged)] = 0;
  const compressed = createXlsxFixture(base).slice();
  compressed[directory(compressed) + 10] = 9;
  TestValidator.predicate(
    "structural refusals",
    throwsError(
      () =>
        readXlsxSheet(
          createXlsxFixture({ ...base, omit: ["xl/_rels/workbook.xml.rels"] }),
          "Data",
        ),
      "no xl/_rels/workbook.xml.rels",
    ) &&
      throwsError(
        () =>
          readXlsxSheet(createXlsxFixture({ ...base, detached: true }), "Data"),
        "does not locate the sheet Data",
      ) &&
      throwsError(() => readXlsxSheet(compressed, "Data"), "uses compression 9") &&
      throwsError(() => readXlsxSheet(damaged, "Data"), "central directory"),
  );
};
