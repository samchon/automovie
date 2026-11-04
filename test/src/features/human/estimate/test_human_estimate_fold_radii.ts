import { HumanReferenceSections } from "../../internal/HumanReferenceSections";
import { HumanSectionShape } from "../../internal/HumanSectionShape";

type V3 = HumanReferenceSections.V3;

/** Height step between the pack's sections, mm, the second difference's step. */
const STEP: number = 10;

/**
 * An estimate reading, not a check: the skin's radius in the body's folds,
 * from the private reference curves, over the four people's sides; the
 * published site atlas of subcutaneous fat (Störchle et al. 2017, Ultrasound
 * Med Biol 43(2)) is not reachable from this machine.
 *
 * Each fold is read as the radius of the skin's profile where it turns into
 * the crease, in the sagittal plane through the limb's centre (the skin
 * within 2 mm of that plane, its most anterior or posterior point per
 * section): `(1 + x'^2)^(3/2) / |x''|` from the profile's differences over
 * 10 mm, the least radius on the crease's side of a band about the fold:
 *
 * - the groin: the front profile through the thigh's centre 20 mm under the
 *   crotch, from 20 mm under to 60 mm over the crotch, where the profile
 *   turns back (a minimum of x);
 * - the gluteal fold: the back profile through the same centre, 40 mm either
 *   side of the crotch, where it turns forward;
 * - the ankle's front: the front profile through the ankle's centre (the
 *   pack's ankle cut), 40 mm either side of the cut;
 * - the axilla: the vault between the arm and the trunk, from the gap g
 *   between the arm's loop and the trunk's at a depth d under the armpit cut,
 *   `R = g^2 / (8 d)` for a circular vault, read at d = 20 mm.
 *
 * Each fold prints its radius's mean and SD in millimetres and per stature,
 * no value of one person and no curve.
 *
 * Scenarios:
 * 1. Prints the groin's, the gluteal fold's, the ankle front's and the axilla's radius, mm and per stature.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads the private pack (`HumanReferenceSections`) and prints the aggregates; without the pack it prints that it did not run.
 * @evidence contracts/testing.md#independent-expectations No expectation: an estimate reading kept in its own removable file that no real test imports.
 * @evidence contracts/testing.md#distinguishing-cases Two women and two men, both sides; a fold whose profile shows no turn in its band is left out and the count shows it.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_estimate_fold_radii`, reading local files on the CPU, part of no acceptance.
 */
export function test_human_estimate_fold_radii(): void {
  const ids: string[] = HumanReferenceSections.available();
  if (ids.length === 0) {
    console.log("test_human_estimate_fold_radii: no private curve pack in .references/curves; nothing read");
    return;
  }
  const radii: Record<string, number[]> = { groin: [], gluteal: [], ankle: [], axilla: [] };
  const perStature: Record<string, number[]> = { groin: [], gluteal: [], ankle: [], axilla: [] };
  const push = (fold: string, r: number, stature: number): void => {
    if (!Number.isFinite(r)) return;
    radii[fold]!.push(r);
    perStature[fold]!.push(r / stature);
  };
  for (const id of ids) {
    const marks: HumanReferenceSections.ILandmarks = HumanReferenceSections.landmarks(id);
    const stature: number = marks.statureMm;
    for (const [leg, ankleCut, side] of [
      ["leg_l", marks.ankle_lMm, 1],
      ["leg_r", marks.ankle_rMm, -1],
    ] as const) {
      const centreAt = (region: string, y: number): V3 | null => {
        const row: HumanReferenceSections.ISection | undefined = HumanReferenceSections.sections(id, region, [y - 6, y + 6]).find((s: HumanReferenceSections.ISection): boolean => s.loops.length !== 0);
        if (row === undefined) return null;
        return row.loops.map(HumanReferenceSections.extent).reduce((a: HumanReferenceSections.IExtent, b: HumanReferenceSections.IExtent): HumanReferenceSections.IExtent => (b.girth > a.girth ? b : a)).centre;
      };
      const profile = (regions: string[], z: number, lo: number, hi: number, front: boolean): { y: number; x: number }[] => {
        const out: { y: number; x: number }[] = [];
        const rows: HumanReferenceSections.ISection[] = regions.flatMap((r: string): HumanReferenceSections.ISection[] => HumanReferenceSections.sections(id, r, [lo, hi]));
        for (const y of [...new Set(rows.map((s: HumanReferenceSections.ISection): number => Math.round(s.y)))].sort((a: number, b: number): number => a - b)) {
          const xs: number[] = rows
            .filter((s: HumanReferenceSections.ISection): boolean => Math.round(s.y) === y)
            .flatMap((s: HumanReferenceSections.ISection): V3[] => [...s.loops, ...s.arcs].flatMap((l: HumanReferenceSections.ILoop): V3[] => l.points))
            .filter((p: V3): boolean => Math.abs(p[2] - z) <= 2)
            .map((p: V3): number => p[0]);
          if (xs.length !== 0) out.push({ y, x: front ? Math.max(...xs) : Math.min(...xs) });
        }
        return out;
      };

      // The least radius where the profile turns toward the crease: for a
      // front profile x'' > 0 (a minimum), for a back profile x'' < 0.
      const crease = (p: { y: number; x: number }[], front: boolean): number => {
        let best: number = Infinity;
        for (let i: number = 1; i + 1 < p.length; i++) {
          if (Math.abs(p[i + 1]!.y - p[i]!.y - STEP) > 2 || Math.abs(p[i]!.y - p[i - 1]!.y - STEP) > 2) continue;
          const d2: number = (p[i + 1]!.x - 2 * p[i]!.x + p[i - 1]!.x) / (STEP * STEP);
          const d1: number = (p[i + 1]!.x - p[i - 1]!.x) / (2 * STEP);
          if ((front && d2 > 0) || (!front && d2 < 0)) best = Math.min(best, (1 + d1 * d1) ** 1.5 / Math.abs(d2));
        }
        return best;
      };
      const thigh: V3 | null = centreAt(leg, marks.crotchMm - 20);
      if (thigh !== null) {
        push("groin", crease(profile([leg, "trunk"], thigh[2], marks.crotchMm - 20, marks.crotchMm + 60, true), true), stature);
        push("gluteal", crease(profile([leg, "trunk"], thigh[2], marks.crotchMm - 40, marks.crotchMm + 40, false), false), stature);
      }
      const ankle: V3 | null = centreAt(leg, ankleCut);
      if (ankle !== null) push("ankle", crease(profile([leg, side > 0 ? "foot_l" : "foot_r"], ankle[2], ankleCut - 40, ankleCut + 40, true), true), stature);
    }

    // The axilla: the gap between each arm's loop and the trunk 20 mm under the armpit cut.
    const armpit: number = marks.armpitMm;
    if (Number.isFinite(armpit))
      for (const [arm, side] of [
        ["arm_l", 1],
        ["arm_r", -1],
      ] as const) {
        const y: number = armpit - 20;
        const armRow: HumanReferenceSections.ISection | undefined = HumanReferenceSections.sections(id, arm, [y - 6, y + 6]).find((s: HumanReferenceSections.ISection): boolean => s.loops.length !== 0);
        const trunkRow: HumanReferenceSections.ISection | undefined = HumanReferenceSections.sections(id, "trunk", [y - 6, y + 6]).find((s: HumanReferenceSections.ISection): boolean => s.loops.length !== 0);
        if (armRow === undefined || trunkRow === undefined) continue;
        const armInner: number = Math.min(...armRow.loops.flatMap((l: HumanReferenceSections.ILoop): number[] => l.points.map((p: V3): number => side * p[2])));
        const trunkOuter: number = Math.max(...trunkRow.loops.flatMap((l: HumanReferenceSections.ILoop): number[] => l.points.map((p: V3): number => side * p[2])));
        const gap: number = armInner - trunkOuter;
        if (gap > 0) push("axilla", (gap * gap) / (8 * 20), stature);
      }
  }
  const S: typeof HumanSectionShape = HumanSectionShape;
  for (const fold of Object.keys(radii)) console.log(`fold ${fold}: radius ${S.stat(radii[fold]!, 1)} mm, per stature ${S.stat(perStature[fold]!, 4)}`);
}
