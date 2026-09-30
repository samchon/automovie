import { TestValidator } from "@nestia/e2e";

import { readXlsxSheet } from "../../../scripts/face-review/readXlsxSheet";
import { createXlsxFixture } from "../internal/createXlsxFixture";
import { throwsError } from "../internal/predicates";

/**
 * The workbook reader returns the named sheet as dense rows numbered as the
 * sheet numbers them.
 *
 * Scenarios:
 * 1. Row 1 holds a shared string in A, a number in C (B absent) and an inline
 *    string in D; row 3 holds a decimal in AA (column 26). The result has an
 *    empty row 2 between them, `null` for the absent B, and column 26 at
 *    index 26 (the multi-letter column arithmetic).
 * 2. The same content read from a stored (uncompressed) archive is identical,
 *    so both ZIP methods work.
 * 3. A sheet that is not in the workbook, a name whose part is missing and a
 *    file that is not a ZIP each refuse, and the other sheet stays unread.
 * 4. An XML-escaped shared string decodes (`&amp;` after `&lt;`, no double
 *    decoding).
 */
export const test_subject_face_xlsx_sheet = (): void => {
  const input = {
    sheet: "Data",
    rows: {
      1: [
        ["A1", "s", 0],
        ["C1", "n", 2.5],
        ["D1", "i", "inline"],
      ],
      3: [["AA3", "n", 7]],
    } as Parameters<typeof createXlsxFixture>[0]["rows"],
    shared: ["a &amp;lt; b"],
  };
  const rows = readXlsxSheet(createXlsxFixture(input), "Data");
  TestValidator.equals("row count", rows.length, 3);
  TestValidator.equals("first row", rows[0]!.slice(0, 4), [
    "a &lt; b",
    null,
    2.5,
    "inline",
  ]);
  TestValidator.equals("gap", rows[1], []);
  TestValidator.equals("wide column", rows[2]![26], 7);
  TestValidator.equals("wide column padding", rows[2]![25], null);
  TestValidator.equals(
    "stored parts",
    readXlsxSheet(
      createXlsxFixture({
        ...input,
        stored: [
          "xl/workbook.xml",
          "xl/sharedStrings.xml",
          "xl/worksheets/sheet2.xml",
        ],
      }),
      "Data",
    ),
    rows,
  );
  TestValidator.predicate(
    "refusals",
    throwsError(
      () => readXlsxSheet(createXlsxFixture(input), "Missing"),
      "no sheet named Missing",
    ) &&
      throwsError(
        () => readXlsxSheet(new Uint8Array(64), "Data"),
        "not a ZIP archive",
      ),
  );
};
