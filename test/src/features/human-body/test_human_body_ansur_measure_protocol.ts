import { HUMAN_BODY_MEASUREMENTS, measureHumanBodySection } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { ANSUR_BODY_MEASURES } from "../../../scripts/body-ansur/ANSUR_BODY_MEASURES";
import { formatAnsurCensusTable } from "../../../scripts/body-ansur/formatAnsurCensusTable";
import { nclose } from "../internal/predicates";

/**
 * Survey-site resemblance must not classify unlike instruments as identical.
 * Hotzman et al. (2011), NATICK/TR-11/017, sections 6.4.5, 6.4.17,
 * 6.4.22 and 6.4.93 independently define the horizontal ankle/calf tapes,
 * right-buttock level with heels together and stylion tape with elbow at 90
 * degrees. The body instead reads its sampled left-limb/rest instruments.
 * https://tools.openlab.psu.edu/publicData/ANSURII-TR11-017.pdf.
 *
 * Scenarios:
 * 1. A square prism tilted 45 degrees has axis-normal girth 8 m and
 *    horizontal girth 4 + 4 sqrt(2) m. The real plane-cut instrument shows
 *    that the survey's horizontal plane cannot replace a limb-axis plane.
 * 2. The resident calf and ankle rules use limb-axis planes, while the
 *    independent survey protocols above use horizontal planes.
 * 3. Each of the four survey protocols reaches the report through its actual
 *    registry entry as a different definition for both sexes. A signed
 *    residual of 33 - 37 mm remains -4 mm; classification changes no reading.
 *    The wrist's registered site and the buttock's acquisition stance also
 *    distinguish them despite their similar anatomical purposes.
 */
export const test_human_body_ansur_measure_protocol = (): void => {
  const root = Math.sqrt(0.5);
  const positions = [
    [-1, -2, -1],
    [1, -2, -1],
    [1, 2, -1],
    [-1, 2, -1],
    [-1, -2, 1],
    [1, -2, 1],
    [1, 2, 1],
    [-1, 2, 1],
  ].flatMap(([x, y, z]) => [(x + y) * root, (y - x) * root, z]);
  const indices = [
    0, 2, 1, 0, 3, 2,
    4, 5, 6, 4, 6, 7,
    0, 1, 5, 0, 5, 4,
    3, 7, 6, 3, 6, 2,
    0, 4, 7, 0, 7, 3,
    1, 2, 6, 1, 6, 5,
  ];
  const point = { x: 0, y: 0, z: 0 };
  const axis = measureHumanBodySection(
    positions,
    indices,
    { point, normal: { x: root, y: root, z: 0 } },
    point,
  );
  const horizontal = measureHumanBodySection(
    positions,
    indices,
    { point, normal: { x: 0, y: 1, z: 0 } },
    point,
  );
  TestValidator.predicate(
    "tilted prism distinguishes survey and body section planes",
    axis !== null && horizontal !== null &&
      nclose(axis.girth, 8) &&
      nclose(horizontal.girth, 4 + 4 * Math.sqrt(2)),
  );
  for (const id of ["measureCalfCirc", "measureAnkleCirc"]) {
    const rule = HUMAN_BODY_MEASUREMENTS[id];
    TestValidator.predicate(
      "resident instrument is axis-normal, unlike horizontal survey tape: " + id,
      rule.kind === "girth" && !rule.horizontal,
    );
  }
  // These witnesses come from the four independent survey protocols, not a
  // snapshot of the registry's fourteen classification flags.
  const protocols = [
    { column: "calfcircumference", difference: "horizontal right-calf tape" },
    { column: "anklecircumference", difference: "horizontal ankle tape" },
    { column: "wristcircumference", difference: "stylion with elbow at 90 degrees" },
    { column: "buttockcircumference", difference: "right projection with heels together" },
  ];
  for (const protocol of protocols) {
    const measure = ANSUR_BODY_MEASURES.find(
      (row) => row.column === protocol.column,
    );
    TestValidator.predicate("survey witness has a resident comparison", measure !== undefined);
    for (const sex of ["female", "male"] as const) {
      const report = formatAnsurCensusTable([{
        sex,
        measure: measure!.name,
        sameDefinition: measure!.sameDefinition,
        count: 1,
        bands: [{ count: 1, mean: 33 - 37, sd: 0 }],
      }]);
      const cells = report.trim().split("\n")[2].split("|").map((cell) => cell.trim());
      TestValidator.equals(
        sex + " report distinguishes " + protocol.difference,
        cells[3],
        "different",
      );
      TestValidator.equals("classification preserves signed residual", cells[5], "-4 (0)");
    }
  }
};
