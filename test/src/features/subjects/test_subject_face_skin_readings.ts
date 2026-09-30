import { TestValidator } from "@nestia/e2e";

import { readFaceSkinReadings } from "../../../scripts/face-review/readFaceSkinReadings";
import type { XlsxCell } from "../../../scripts/face-review/readXlsxSheet";
import { nclose, throwsError } from "../internal/predicates";

const PAD = 13;
const band = (value: number, bands = 39): XlsxCell[] =>
  Array.from({ length: bands }, () => value);
const line = (values: XlsxCell[]): XlsxCell[] => [
  ...Array.from({ length: PAD }, () => null),
  ...values,
];
const reading = (
  overrides: Partial<{
    first: XlsxCell;
    origin: XlsxCell;
    subject: XlsxCell;
    ethnicity: XlsxCell;
    sex: XlsxCell;
    site: XlsxCell;
    spectrum: XlsxCell[];
  }>,
): XlsxCell[] => {
  const cells = line(overrides.spectrum ?? band(50));
  cells[0] = overrides.first === undefined ? 1 : overrides.first;
  cells[1] = overrides.origin ?? "o";
  cells[2] = overrides.subject ?? "s";
  cells[3] = overrides.ethnicity ?? "CA";
  cells[4] = overrides.sex === undefined ? "F" : overrides.sex;
  cells[6] = overrides.site ?? 2;
  return cells;
};
const sheet = (readings: XlsxCell[][]): XlsxCell[][] => [
  [],
  line(band(0)),
  line(band(1)),
  line(band(1)),
  line(band(1)),
  line(band(1)),
  ...Array.from({ length: 6 }, () => []),
  ...readings,
];

/**
 * The archive sheet's readings are integrated per row.
 *
 * Scenarios:
 * 1. With unit tables, a 50 percent reading of the cheek integrates to half of
 *    the sRGB matrix row sums (1.2047843, 0.9483008, 0.9088427); the reading
 *    carries its group, sex, subject key (origin and subject columns) and site.
 * 2. A row without a first cell, a site not asked for and a 30-band reading are
 *    skipped, and a reading with no recorded sex keeps `null`.
 * 3. A non-numeric band table refuses, and a numeric value in a wavelength
 *    column beyond the table is not read.
 */
export const test_subject_face_skin_readings = (): void => {
  const readings = readFaceSkinReadings(
    sheet([
      reading({}),
      reading({ first: null }),
      reading({ site: 9 }),
      reading({ spectrum: band(50, 30) }),
      reading({ sex: null, subject: "t", ethnicity: "JP" }),
    ]),
    new Set([2]),
  );
  TestValidator.equals("count", readings.length, 2);
  const first = readings[0]!;
  TestValidator.predicate(
    "rgb",
    nclose(first.rgb[0], 0.5 * 1.2047843, 1e-12) &&
      nclose(first.rgb[1], 0.5 * 0.9483008, 1e-12) &&
      nclose(first.rgb[2], 0.5 * 0.9088427, 1e-12),
  );
  TestValidator.equals(
    "identity",
    [first.ethnicity, first.sex, first.subject, first.site],
    ["CA", "F", '["o","s"]', 2],
  );
  TestValidator.equals("unrecorded sex", readings[1]!.sex, null);
  const broken = sheet([]);
  broken[3] = line(band(1).map((value, index) => (index === 4 ? "x" : value)));
  TestValidator.predicate(
    "table refusals",
    throwsError(
      () => readFaceSkinReadings(broken, new Set([2])),
      "Sheet row 4 is not a numeric band table",
    ) &&
      throwsError(
        () => readFaceSkinReadings([[], []], new Set([2])),
        "Sheet row 3 is not a numeric band table",
      ),
  );
};
