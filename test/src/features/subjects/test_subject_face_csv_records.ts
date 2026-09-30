import { TestValidator } from "@nestia/e2e";

import { readCsvRecords } from "../../../scripts/face-review/readCsvRecords";
import { throwsError } from "../internal/predicates";

/**
 * The CSV reader follows RFC 4180 for the survey tables.
 *
 * Scenarios:
 * 1. A header and two rows with CRLF endings, a blank line, a quoted field
 *    holding a comma and a doubled quote, and a quoted field holding a line
 *    break: each is one record whose values stay strings.
 * 2. A final row without a line break is still a record, a short row leaves its
 *    missing columns out, and an empty text has no records.
 * 3. A row longer than the header and a text ending inside a quote refuse,
 *    because either is not the table named.
 */
export const test_subject_face_csv_records = (): void => {
  TestValidator.equals(
    "quoting",
    readCsvRecords('a,b,c\r\n1,"x, ""y""",3\r\n\r\n4,"line\nbreak",6\r\n'),
    [
      { a: "1", b: 'x, "y"', c: "3" },
      { a: "4", b: "line\nbreak", c: "6" },
    ],
  );
  TestValidator.equals(
    "no final break and a short row",
    readCsvRecords("a,b\n1,2\n3"),
    [{ a: "1", b: "2" }, { a: "3" }],
  );
  TestValidator.equals("empty", readCsvRecords(""), []);
  TestValidator.predicate(
    "refusals",
    throwsError(() => readCsvRecords("a\n1,2\n"), "more fields") &&
      throwsError(() => readCsvRecords('a\n"open'), "quoted field"),
  );
};
