import { HumanInputs } from "./HumanInputs";
import { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyAudit } from "./HumanAnatomyAudit";
import { HumanAnatomyMade } from "./HumanAnatomyMade";
import { HumanPeople } from "./HumanPeople";

type V3 = HumanAnatomy.V3;

/**
 * Measure one region on every person and fail with every measurement that
 * misses its expectation, by person and site, after proving the region's
 * audit red on a made subject.
 *
 * The proof: each region but the pose's must list more failing rows on its
 * made subject than on f1 itself, and must read the made subject without a
 * throw. The identity regions (arm, hand, leg, foot, head, trunk) read f1's
 * skin against its inputs raised 15 % (`HumanAnatomyMade.inputs`); the head's
 * consistency reads f1 with its lower face widened 60 % from the chin to the
 * eyes, which no adult head has (the bigonial and bizygomatic breadths pass
 * the cranium's); the trunk's silhouette reads f1 with a bulge of 35 % of
 * breadth round its natural waist. The pose audit reads its posed skins by
 * person name and takes no made skin; its proof is owed.
 *
 * @param region A key of {@link HumanAnatomyAudit.REGIONS}.
 * @throws {Error} Listing every failing measurement and any proof that stayed green.
 */
export function assertHumanAnatomy(region: string): void {
  const audit: (subject: HumanAnatomyAudit.ISubject) => HumanAnatomyAudit.IRow[] = HumanAnatomyAudit.REGIONS[region]!;
  const failed: HumanAnatomyAudit.IRow[] = [];
  const proof: string[] = [];
  const red: (s: HumanAnatomyAudit.ISubject) => number = (s: HumanAnatomyAudit.ISubject): number => audit(s).filter((r: HumanAnatomyAudit.IRow): boolean => !HumanAnatomyAudit.passes(r)).length;

  const made: HumanAnatomyAudit.ISubject | null = MADE[region]?.() ?? null;
  if (made !== null) {
    try {
      const base: number = red(HumanAnatomyAudit.subject("f1"));
      const after: number = red(made);
      if (!(after > base)) proof.push(`proof: ${made.name} lists ${after} failing ${region} rows, f1 itself ${base}; expected more`);
    } catch (error) {
      proof.push(`proof: ${made.name} could not be measured: ${(error as Error).message}`);
    }
  }

  for (const name of HumanPeople.names()) {
    try {
      failed.push(...audit(HumanAnatomyAudit.subject(name)).filter((r: HumanAnatomyAudit.IRow): boolean => !HumanAnatomyAudit.passes(r)));
    } catch (error) {
      failed.push({ person: name, site: `could not be measured: ${(error as Error).message}`, value: NaN, low: 0, high: 0, unit: "" });
    }
  }
  if (failed.length === 0 && proof.length === 0) return;
  const lines: string[] = failed
    .sort(
      (a: HumanAnatomyAudit.IRow, b: HumanAnatomyAudit.IRow): number =>
        a.person.localeCompare(b.person) || a.site.localeCompare(b.site),
    )
    .map(
      (r: HumanAnatomyAudit.IRow): string =>
        `${r.person.padEnd(10)} ${r.site}: ${r.value.toFixed(2)} ${r.unit} outside ${r.low.toFixed(2)} to ${r.high.toFixed(2)}`,
    );
  throw new Error(`${failed.length} ${region} measurements miss their expectation:\n${[...proof, ...lines].join("\n")}`);
}

/** f1's stature, mm. */
function stature(): number {
  return HumanInputs.stature(HumanAnatomyAudit.subject("f1").params);
}

/** Each region's made subject. */
const MADE: Record<string, () => HumanAnatomyAudit.ISubject> = {
  arm: HumanAnatomyMade.inputs,
  hand: HumanAnatomyMade.inputs,
  leg: HumanAnatomyMade.inputs,
  foot: HumanAnatomyMade.inputs,
  head: HumanAnatomyMade.inputs,
  trunk: HumanAnatomyMade.inputs,

  // The lower face from the menton's height (0.87 S) to the eyes' (0.93 S).
  headConsistency: (): HumanAnatomyAudit.ISubject => {
    const S: number = stature();
    return HumanAnatomyMade.warped("wide lower face", (p: V3, skin: HumanAnatomy.ISkin): V3 => HumanAnatomyMade.widen(HumanAnatomy.joint(skin, "head"), 0.85 * S, 0.95 * S, 0.6, false, true)(p));
  },

  // The natural waist about 0.62 S, bulged over 0.56 S to 0.68 S.
  trunkSilhouette: (): HumanAnatomyAudit.ISubject => {
    const S: number = stature();
    return HumanAnatomyMade.warped("waist bulge", (p: V3, skin: HumanAnatomy.ISkin): V3 => HumanAnatomyMade.widen(HumanAnatomy.joint(skin, "spine"), 0.56 * S, 0.68 * S, 0.35, false, true)(p));
  },
};
