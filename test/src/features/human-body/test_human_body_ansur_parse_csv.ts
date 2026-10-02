import { TestValidator } from "@nestia/e2e";

import { parseAnsurCsv } from "../../../scripts/body-ansur/parseAnsurCsv";
import { throwsError } from "../internal/predicates";

/**
 * An ANSUR II CSV becomes numeric records keyed by lower-cased column names.
 *
 * Scenarios:
 * 1. Mixed-case headers lower-case, CRLF line ends and a trailing blank line
 *    are tolerated, and numeric fields keep their value.
 * 2. A text field and an empty field are dropped from the record instead of
 *    becoming NaN, while the row's numeric fields survive.
 * 3. A row with fewer fields than the header is refused with its line number.
 * 4. An empty file yields no records.
 */
export const test_human_body_ansur_parse_csv = (): void => {
  const rows = parseAnsurCsv(
    "SubjectId,Stature,Gender,WeightKg\r\n10,1700,Female,655\r\n11,1800,Male,\r\n\r\n",
  );
  TestValidator.equals("two people", rows.length, 2);
  TestValidator.equals("numeric fields keep their value", rows[0], {
    subjectid: 10,
    stature: 1700,
    weightkg: 655,
  });
  TestValidator.equals("text and empty fields are dropped", rows[1], {
    subjectid: 11,
    stature: 1800,
  });
  TestValidator.predicate(
    "a short row names its line",
    throwsError(() => parseAnsurCsv("a,b\n1,2\n3\n"), "row 3"),
  );
  TestValidator.equals("empty text", parseAnsurCsv(""), []);
};
