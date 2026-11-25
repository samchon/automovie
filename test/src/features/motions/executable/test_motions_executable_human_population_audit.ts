import type { IAutoMovieHumanParameters } from "@automovie/interface";
import { HumanPopulationAccess, HumanPopulationAnchors, HumanPopulationAudit, f1, f2 } from "@automovie/motions/executable/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * How far Ramanujan's first approximation may fall from the exact perimeter of
 * the 10 by 5 mm ellipse, mm: its truncation error leads with `-h³ / 512` of
 * `pi (a + b)`, `h = ((a - b) / (a + b))²` (Almkvist and Berndt 1988, Amer.
 * Math. Monthly 95:585), doubled here for the higher terms at `h = 1/9`.
 */
const RAMANUJAN: number = (Math.PI * 15 * (1 / 9) ** 3) / 256;

/**
 * The capture population's audit of a person's inputs: each surveyed range and
 * population relation once per side of a paired input, each relation's band its
 * sex's ANSUR 1988 mean plus and minus three deviations; the anchors carrying
 * unsurveyed courses; and the perimeters it reads.
 *
 * The reference woman `f1` gives both hands, feet and ears; her natural waist
 * is 673.627 mm and her hip 991.406 mm; women's waist over hip is 0.7503 (SD
 * 0.0431).
 *
 * Scenarios:
 *
 * 1. Her waist-over-hip row reads her own ratio against the women's band, and the
 *    row passes on its bound and fails just outside it.
 * 2. Two hands, two feet and two ears give 34 range rows and 32 relation rows;
 *    without extremities 24 and 20 remain.
 * 3. The thumb rides the hand length by the reference women's mean thumb over hand
 *    length.
 * 4. The 10 by 5 mm ellipse's perimeter is `40 E(sqrt(3) / 2)` = 48.4422411 mm
 *    within Ramanujan's truncation error.
 */
export function test_motions_executable_human_population_audit(): void {
  // 1. A relation row.
  const rows: HumanPopulationAudit.IRow[] = HumanPopulationAudit.audit(
    "f1",
    "female",
    f1,
  );
  const waist: HumanPopulationAudit.IRow = rows.find(
    (row: HumanPopulationAudit.IRow): boolean =>
      row.site === "relation: natural waist / hip",
  )!;
  TestValidator.predicate(
    "her ratio against the women's band",
    nclose(waist.value, 673.6269910921733 / 991.406328716076, 1e-9) &&
      nclose(waist.low, 0.7503 - 3 * 0.0431, 1e-12) &&
      nclose(waist.high, 0.7503 + 3 * 0.0431, 1e-12) &&
      HumanPopulationAudit.passes({ ...waist, value: waist.high }) &&
      !HumanPopulationAudit.passes({ ...waist, value: waist.high + 1e-3 }),
  );

  // 2. Paired inputs.
  const bare: IAutoMovieHumanParameters = structuredClone(f1);
  delete bare.extremities;
  const plain: HumanPopulationAudit.IRow[] = HumanPopulationAudit.audit(
    "bare",
    "female",
    bare,
  );
  const count = (of: HumanPopulationAudit.IRow[], prefix: string): number =>
    of.filter((row: HumanPopulationAudit.IRow): boolean =>
      row.site.startsWith(prefix),
    ).length;
  TestValidator.equals(
    "a row per side of a paired input",
    [
      count(rows, "surveyed female range: "),
      count(rows, "relation: "),
      count(plain, "surveyed female range: "),
      count(plain, "relation: "),
    ],
    [34, 32, 24, 20],
  );

  // 3. An anchor.
  const thumb = (p: IAutoMovieHumanParameters): number =>
    p.extremities!.hands!.left.thumbLength /
    p.extremities!.hands!.left.handLength;
  TestValidator.predicate(
    "the mean thumb over hand length",
    nclose(
      HumanPopulationAnchors.ratio(
        "female",
        HumanPopulationAnchors.ANCHORS.thumbLength,
      ),
      (thumb(f1) + thumb(f2)) / 2,
      1e-12,
    ),
  );

  // 4. A perimeter.
  TestValidator.predicate(
    "the ellipse",
    nclose(HumanPopulationAccess.ellipse(10, 5), 48.4422411, RAMANUJAN),
  );
}
