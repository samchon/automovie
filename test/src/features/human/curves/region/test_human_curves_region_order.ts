import { HumanAnatomy } from "../../../internal/HumanAnatomy";
import { HumanAnatomyAudit } from "../../../internal/HumanAnatomyAudit";
import { HumanAnatomyShared } from "../../../internal/HumanAnatomyShared";
import { HumanAnatomyTrunk } from "../../../internal/HumanAnatomyTrunk";
import { HumanCurveOrder } from "../../../internal/curves/HumanCurveOrder";
import { HumanPeople } from "../../../internal/HumanPeople";

type IRow = HumanAnatomyAudit.IRow;

/**
 * Pins that every person's generated girths stand in the order of that
 * person's own tape inputs, at the tapes' ISO 8559-1 and ANSUR sites: when the
 * inputs say chest over waist, the skin's chest girth exceeds its waist girth,
 * and so for every pair of tapes the inputs resolve.
 *
 * Scenarios:
 * 1. A copy of f1's bind skin whose chest is narrowed by a smooth band to 0.65 of its girth reads its chest girth below its waist girth, and the chest-over-waist row turns red with a finite negative value.
 * 2. Every person of `HumanPeople`: every resolved pair of tapes on each side is read, and every pair out of its input order is listed by person and pair.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person's bind skin and reads its girths at their sites with the region audits' own locators (`HumanAnatomyTrunk.trunkSites` and `neckSites`, `HumanAnatomyArm.armSites`, `HumanAnatomyLeg.legSites`, `HumanAnatomyHand.handSites` at the neutral): chest at the bust point, underbust at the inframammary fold, natural waist, high hip, hip at the buttocks' prominence, neck, neck base, and per side upper arm, elbow, forearm, wrist, thigh, mid-patella knee, calf and hand circumference. For every pair of tapes whose inputs differ by more than the sum of their two allowable errors, it reads the generated girth of the larger input less that of the smaller, which must be positive. It catches a construction that swaps, flattens or crosses two tapes, such as a chest narrower than its waist on a person whose inputs say otherwise, a thigh no wider than its knee, a wrist wider than its forearm, whatever the absolute sizes.
 * @evidence contracts/testing.md#independent-expectations The expectation is the person's own inputs: the order of two tapes is the order of their inputs, and a pair whose inputs differ by no more than the sum of their ISO 20685-1:2018 Table 4 errors (9 mm for the trunk's and the thigh's large circumferences, 4 mm for the others) is not resolved by the tapes and is not read. The inputs themselves are bounded by the population in `test_human_people` (ANSUR 1988 chest over natural waist 1.253, SD 0.055, in women; 1.183, SD 0.050, in men). No construction constant or reference shape enters. Proven red here: f1's chest narrowed to 0.65 of its girth by a Gaussian band of 40 mm about its bust height, scaling the trunk and shoulder skin about the spine's joint line, reads its chest about 0.35 of 857 mm smaller while the waist 170 mm lower is untouched, so chest less waist turns from positive to a finite negative value. Oracle limits: the sites are the region audits' own, so a misplaced site moves both its identity row and its order rows; the hand circumference is read at the neutral, the other girths at the bind.
 * @evidence contracts/testing.md#distinguishing-cases The core set's four references and six population ends, whose inputs order their tapes differently (a heavy person's waist near her chest, a calf larger or smaller than its knee), so both orders of the near pairs are read and the unresolved pairs are left out. Each tape's value against its own input belongs to `test_human_anatomy_trunk`, `_arm`, `_leg` and `_hand`; this test owns only the relations between tapes.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curves_region_order`, generating the cached people's bind and neutral skins in process on the CPU with no renderer, browser or GPU.
 */
export function test_human_curves_region_order(): void {
  const failures: string[] = [...made()];

  // Every person is read even when another fails, so one run lists everything.
  for (const name of HumanPeople.names()) {
    try {
      for (const r of HumanCurveOrder.rows(HumanAnatomyAudit.subject(name))) if (!HumanAnatomyAudit.passes(r)) failures.push(format(r));
    } catch (error) {
      failures.push(`${name.padEnd(14)} could not be read: ${(error as Error).message}`);
    }
  }
  if (failures.length !== 0) throw new Error(`${failures.length} girth order findings:\n${failures.join("\n")}`);
}

/** f1 with its chest narrowed below its waist, required to fail the chest-over-waist row with a finite value. */
function made(): string[] {
  const base: HumanAnatomyAudit.ISubject = HumanAnatomyAudit.subject("f1");
  const skin: HumanAnatomy.ISkin = base.bind();
  const S: number = base.params.body.controls.height.value!;
  const chest: number = HumanAnatomyTrunk.trunkSites(skin, S).heights.chest;

  // The trunk's and shoulders' vertices, scaled toward the spine's joint line
  // by a smooth band about the bust height, so the bust point stays a
  // prominence and the band leaves no step.
  const keep: Set<number> = new Set();
  for (const t of HumanAnatomy.triangles(skin, /^(trunk|upper)$/)) for (let k: number = 0; k < 3; k++) keep.add(skin.I[3 * t + k]!);
  const P: Float64Array = Float64Array.from(skin.P);
  for (const v of keep) {
    const y: number = P[3 * v + 1]!;
    const f: number = 1 - 0.35 * Math.exp(-(((y - chest) / 40) ** 2));
    const x0: number = HumanAnatomyShared.spineX(skin, y);
    P[3 * v] = x0 + (P[3 * v]! - x0) * f;
    P[3 * v + 2] = P[3 * v + 2]! * f;
  }
  const copy: HumanAnatomy.ISkin = { ...skin, name: "f1 chest narrowed", P };
  const subject: HumanAnatomyAudit.ISubject = { ...base, name: "f1 chest narrowed", bind: (): HumanAnatomy.ISkin => copy };

  const rows: IRow[] = HumanCurveOrder.rows(subject);
  const row: IRow | undefined = rows.find((r: IRow): boolean => r.site.startsWith("chest girth over waist girth"));
  if (row === undefined) return ["made chest narrowed: no chest-over-waist row was read"];
  if (!Number.isFinite(row.value) || HumanAnatomyAudit.passes(row)) return [`made chest narrowed: chest over waist read ${row.value.toFixed(2)} mm, expected a finite negative value`];
  return [];
}

/** One finding line. */
function format(r: IRow): string {
  return `${r.person.padEnd(14)} ${r.site}: ${r.value.toFixed(2)} ${r.unit} outside ${r.low.toFixed(2)} to ${r.high.toFixed(2)}`;
}
