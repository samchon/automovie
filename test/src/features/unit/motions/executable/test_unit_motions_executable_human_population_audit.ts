import type { IAutoMovieHumanParameters } from "@automovie/interface";
import { HumanPopulationAudit, f1 } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `HumanPopulationAudit.audit` lists every check of a person's inputs: each
 * declared body domain, the declared sex, each surveyed range once per side of
 * a paired input, and each population relation once per side, each relation's
 * band its sex's ANSUR 1988 mean plus and minus three deviations.
 *
 * The reference woman `f1` gives both hands, both feet and both ears. Her
 * natural waist is 673.627 mm and her hip 991.406 mm; women's waist over hip is
 * 0.7503 (SD 0.0431), and their cephalic index band runs from `77.23 - 3 *
 * 3.52` to `85.17 + 3 * 5.40`.
 *
 * Scenarios:
 *
 * 1. Her 23 declared domains are each read once.
 * 2. Audited as a woman her sex row reads 1; audited as a man, 0.
 * 3. Her waist-over-hip row reads her own ratio against the women's band.
 * 4. The cephalic index row carries the united band.
 * 5. Two hands, two feet and two ears give 34 range rows and 32 relation rows;
 *    without hands and feet the paired rows vanish, 24 and 20 remain.
 */
export function test_unit_motions_executable_human_population_audit(): void {
  const rows: HumanPopulationAudit.IRow[] = HumanPopulationAudit.audit(
    "f1",
    "female",
    f1,
  );
  const count = (of: HumanPopulationAudit.IRow[], prefix: string): number =>
    of.filter((row: HumanPopulationAudit.IRow): boolean =>
      row.site.startsWith(prefix),
    ).length;
  const site = (
    of: HumanPopulationAudit.IRow[],
    name: string,
  ): HumanPopulationAudit.IRow =>
    of.find((row: HumanPopulationAudit.IRow): boolean => row.site === name)!;

  // 1. Domains.
  TestValidator.equals("one row per domain", count(rows, "domain: "), 23);

  // 2. The declared sex.
  TestValidator.equals(
    "the sex row",
    [
      site(rows, "sex declared on a female body").value,
      site(
        HumanPopulationAudit.audit("f1", "male", f1),
        "sex declared on a male body",
      ).value,
    ],
    [1, 0],
  );

  // 3. Waist over hip.
  const waist: HumanPopulationAudit.IRow = site(
    rows,
    "relation: natural waist / hip",
  );
  TestValidator.predicate(
    "her ratio against the women's band",
    nclose(waist.value, 673.6269910921733 / 991.406328716076, 1e-9) &&
      nclose(waist.low, 0.7503 - 3 * 0.0431, 1e-12) &&
      nclose(waist.high, 0.7503 + 3 * 0.0431, 1e-12),
  );

  // 4. The cephalic index.
  const cephalic: HumanPopulationAudit.IRow = site(
    rows,
    "relation: cephalic index",
  );
  TestValidator.predicate(
    "the united cephalic band",
    nclose(cephalic.low, 77.23 - 3 * 3.52, 1e-12) &&
      nclose(cephalic.high, 85.17 + 3 * 5.4, 1e-12),
  );

  // 5. Paired inputs.
  const bare: IAutoMovieHumanParameters = structuredClone(f1);
  delete bare.extremities;
  const plain: HumanPopulationAudit.IRow[] = HumanPopulationAudit.audit(
    "bare",
    "female",
    bare,
  );
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
}
