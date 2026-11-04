import { HumanAnatomy } from "../../../internal/HumanAnatomy";
import { HumanAnatomyAudit } from "../../../internal/HumanAnatomyAudit";
import { HumanAnatomyMade } from "../../../internal/HumanAnatomyMade";
import { HumanAnatomyOrdering } from "../../../internal/HumanAnatomyOrdering";
import { HumanPeople } from "../../../internal/HumanPeople";

/**
 * Every person's landmarks and sections keep the order every adult has:
 * heights from nape to crotch, girths along the arm, the leg's patella, belly
 * and ankle, and the arm's two segments in ANSUR II's proportion.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person's skin and reads on it the height of cervicale, the shoulder points, the axilla, the bust point, the inframammary fold, the natural waist, the buttocks' prominence, the crotch, each patella and calf belly and the ankle joints, the arm's wrist, elbow and forearm girths and its radiale-stylion and acromion-radiale lengths, each by the region audits' own site locators. It fails with every relation any person breaks, by person and site: cervicale above the shoulder points above the axilla; the waist above the buttocks above the crotch; for a feminine person the bust above the fold above the waist; (cervicale - suprasternale) and (axilla - chest) over stature inside ANSUR II's bands; forearm and elbow girth over wrist girth; radiale-stylion over acromion-radiale length inside ANSUR II's band; the crotch above the patella above the calf's belly above the ankle. It catches an input whose change carries one landmark across another, a swapped or inverted section, and a limb whose segments or girths leave human proportion.
 * @evidence contracts/testing.md#independent-expectations Orders come from anatomy (Gray 1918) and from ANSUR II's per-measure means, which order the landmark heights by 0.03 stature or more (`ansur-ii.md`); the bands are ANSUR II per-subject ratios from the public databases (`ansur-ii-trunk-ratios.md`, `ansur-ii-course-measures.md`), each sex's mean plus and minus 2.326 SD and the union of both. A masculine person's bust and fold are not read: the chest point is the nipple, which the modelled skin leaves out. No construction constant or earlier output enters. Oracle limits: a landmark that the skin does not carry reads NaN and fails the rows that need it; the ordering of two landmarks 0.03 stature apart holds for the means and is asserted strictly for each person, so a person at a population end whose own landmarks cross fails by design; the calf's belly follows the leg audit's own search window. Proven red on f1 with both wrists swollen 60 % about their joints, which must list more broken relations than f1 itself.
 * @evidence contracts/testing.md#distinguishing-cases Runs on every person of `HumanPeople`'s run set, and `test_human_input_response_sweep` runs the same rows on every person it perturbs, so the relations are read at both directions of an input as well as at the population ends. The trunk's tapes, limbs' tapes and landmark heights against stature belong to the region audits.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_anatomy_ordering`, generating its people in process on the CPU with no renderer, browser or GPU.
 */
export function test_human_anatomy_ordering(): void {
  const failed: HumanAnatomyAudit.IRow[] = [...proof()];

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

/**
 * Red proof: f1 with the skin within 60 mm of each wrist joint swollen 60 %
 * about the joint, a wrist thicker than the forearm, must list more broken
 * relations than f1 itself, read without a throw.
 */
function proof(): HumanAnatomyAudit.IRow[] {
  const red: (s: HumanAnatomyAudit.ISubject) => number = (s: HumanAnatomyAudit.ISubject): number =>
    HumanAnatomyOrdering.ordering(s).filter((r: HumanAnatomyAudit.IRow): boolean => !HumanAnatomyAudit.passes(r)).length;
  const made: HumanAnatomyAudit.ISubject = HumanAnatomyMade.warped("wide wrists", (p: HumanAnatomy.V3, skin: HumanAnatomy.ISkin): HumanAnatomy.V3 => {
    for (const side of ["left", "right"] as const) {
      const w: HumanAnatomy.V3 = HumanAnatomy.joint(skin, `${side}Hand`);
      const d: number = HumanAnatomy.dist(p, w);
      if (d < 60) return HumanAnatomy.add(w, HumanAnatomy.scale(HumanAnatomy.sub(p, w), 1 + 0.6 * 0.5 * (1 + Math.cos((Math.PI * d) / 60))));
    }
    return p;
  });
  try {
    const base: number = red(HumanAnatomyAudit.subject("f1"));
    const after: number = red(made);
    return after > base ? [] : [{ person: "f1 made", site: `proof: wide wrists list ${after} broken relations, f1 itself ${base}; expected more`, value: after, low: base + 1, high: Infinity, unit: "count" }];
  } catch (error) {
    return [{ person: "f1 made", site: `proof: wide wrists could not be read: ${(error as Error).message}`, value: NaN, low: 0, high: 0, unit: "" }];
  }
}
