import type { IAutoMovieHumanParameters } from "@automovie/interface";
import {
  HumanPopulationAccess
} from "../../../../../packages/motions/src/executable/population/HumanPopulationAccess";
import {
  HumanPopulationAnchors
} from "../../../../../packages/motions/src/executable/population/HumanPopulationAnchors";
import {
  HumanPopulationAudit
} from "../../../../../packages/motions/src/executable/population/HumanPopulationAudit";
import {
  f1
} from "../../../../../packages/motions/src/executable/population/human-parameters/internal/f1";
import {
  f2
} from "../../../../../packages/motions/src/executable/population/human-parameters/internal/f2";
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
 * Exercise the stock population's measurement audit, bilateral input coverage and the unsurveyed thumb anchor. Compare the reference woman's waist-to-hip row with the survey band, count the rows with and without extremities, and check the ellipse approximation used for perimeters.
 *
 * The waist-to-hip band uses the ANSUR 1988 women's mean of 0.7503 and standard deviation of 0.0431. The upper endpoint passes and a value 0.001 past it fails. The ellipse with 10 mm and 5 mm semi-axes checks the circumference independently of the approximation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the ratio and its adjacent boundary, the presence and absence of paired inputs, the thumb reference and the perimeter approximation.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the stock audit on the reference woman's published Human input and a clone with extremities removed. Reads the reported row and range/relation counts, calls the audit's pass predicate at and past the upper bound, then reads the thumb anchor and ellipse perimeter at their owners.
 * @evidence contracts/development/testing.md#independent-expectations Divide the reference waist by hip and use the survey mean plus and minus three deviations for the row endpoints. The enabled input families specify 34 range and 32 relation rows with extremities, and 24 and 20 without them. The two reference women's own thumb-to-hand ratios independently give the anchor mean. The complete elliptic integral gives 48.4422411 mm, with a tolerance based on Ramanujan's truncation bound.
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
