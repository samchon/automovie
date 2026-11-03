import { HumanAnatomyAudit } from "../../../internal/HumanAnatomyAudit";
import { HumanAnatomyOrdering } from "../../../internal/HumanAnatomyOrdering";
import { HumanPeople } from "../../../internal/HumanPeople";

/**
 * Every person's landmarks and sections keep the order every adult has:
 * heights from nape to crotch, girths along the arm, the leg's patella, belly
 * and ankle, and the arm's two segments in ANSUR II's proportion.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person's skin and reads on it the height of cervicale, the shoulder points, the axilla, the bust point, the inframammary fold, the natural waist, the buttocks' prominence, the crotch, each patella and calf belly and the ankle joints, the arm's wrist, elbow and forearm girths and its radiale-stylion and acromion-radiale lengths, each by the region audits' own site locators. It fails with every relation any person breaks, by person and site: cervicale above the shoulder points above the axilla; the waist above the buttocks above the crotch; for a feminine person the bust above the fold above the waist; (cervicale - suprasternale) and (axilla - chest) over stature inside ANSUR II's bands; forearm and elbow girth over wrist girth; radiale-stylion over acromion-radiale length inside ANSUR II's band; the crotch above the patella above the calf's belly above the ankle. It catches an input whose change carries one landmark across another, a swapped or inverted section, and a limb whose segments or girths leave human proportion.
 * @evidence contracts/testing.md#independent-expectations Orders come from anatomy (Gray 1918) and from ANSUR II's per-measure means, which order the landmark heights by 0.03 stature or more (`ansur-ii.md`); the bands are ANSUR II per-subject ratios from the public databases (`ansur-ii-trunk-ratios.md`, `ansur-ii-course-measures.md`), each sex's mean plus and minus 2.326 SD and the union of both. A masculine person's bust and fold are not read: the chest point is the nipple, which the modelled skin leaves out. No construction constant or earlier output enters. Oracle limits: a landmark that the skin does not carry reads NaN and fails the rows that need it; the ordering of two landmarks 0.03 stature apart holds for the means and is asserted strictly for each person, so a person at a population end whose own landmarks cross fails by design; the calf's belly follows the leg audit's own search window.
 * @evidence contracts/testing.md#distinguishing-cases Runs on every person of `HumanPeople`'s run set, and `test_human_input_response_sweep` runs the same rows on every person it perturbs, so the relations are read at both directions of an input as well as at the population ends. The trunk's tapes, limbs' tapes and landmark heights against stature belong to the region audits.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_anatomy_ordering`, generating the cached people in process on the CPU with no renderer, browser or GPU.
 */
export function test_human_anatomy_ordering(): void {
  const failed: HumanAnatomyAudit.IRow[] = [];

  for (const name of HumanPeople.names()) {
    try {
      failed.push(...HumanAnatomyOrdering.ordering(HumanAnatomyAudit.subject(name)).filter((r: HumanAnatomyAudit.IRow): boolean => !HumanAnatomyAudit.passes(r)));
    } catch (error) {
      failed.push({ person: name, site: `could not be measured: ${(error as Error).message}`, value: NaN, low: 0, high: 0, unit: "" });
    }
  }
  if (failed.length === 0) return;

  const lines: string[] = failed
    .sort((a: HumanAnatomyAudit.IRow, b: HumanAnatomyAudit.IRow): number => a.person.localeCompare(b.person) || a.site.localeCompare(b.site))
    .map((r: HumanAnatomyAudit.IRow): string => `${r.person.padEnd(10)} ${r.site}: ${r.value.toFixed(3)} ${r.unit} outside ${r.low.toFixed(3)} to ${r.high.toFixed(3)}`);
  throw new Error(`${failed.length} ordering relations are broken:\n${lines.join("\n")}`);
}
