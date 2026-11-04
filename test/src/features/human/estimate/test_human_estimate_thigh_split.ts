import { HumanReferenceSections } from "../../internal/HumanReferenceSections";
import { HumanSectionShape } from "../../internal/HumanSectionShape";

type V3 = HumanReferenceSections.V3;

/** Trochanterion height on stature, ANSUR II women and men (`docs/sources/ansur-ii.md`): `a + b S`, mm. */
const TROCHANTERION: Readonly<Record<"f" | "m", { a: number; b: number }>> = { f: { a: -126.9, b: 0.597 }, m: { a: -169.9, b: 0.6098 } };

/** Tibiale height on stature, ANSUR II women and men: `a + b S`, mm. */
const TIBIALE: Readonly<Record<"f" | "m", { a: number; b: number }>> = { f: { a: -103.6, b: 0.3325 }, m: { a: -119.1, b: 0.3344 } };

/** The knee joint centre above tibiale, women and men, mm (de Leva 1996, Table 2). */
const KNEE_OVER_TIBIALE: Readonly<Record<"f" | "m", number>> = { f: 29.4, m: 33.5 };

/** The hip joint centre above trochanterion, women and men, mm (de Leva 1996, Table 2). */
const HIP_OVER_TROCHANTERION: Readonly<Record<"f" | "m", number>> = { f: 2.8, m: 3.2 };

/** Shares of the thigh from the knee centre (0) toward the crotch (1). */
const SHARES: readonly number[] = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

/**
 * An estimate reading, not a check: how the thigh's breadth splits either
 * side of the femur's line, from the private reference curves about a line
 * placed by published joint-centre laws, aggregated over the four people's
 * eight legs.
 *
 * The femur's line runs from the hip joint centre to the knee's. The hip
 * centre stands `8 + 0.086 LL` mm from the median plane (Hara et al. 2016,
 * Sci Rep 6:37707, from leg length, one equation for both sexes;
 * `docs/sources/hara-2016.md`), with the leg length read as the trochanterion
 * height (ANSUR II's line on stature) and the centre's height de Leva 1996's
 * offset above trochanterion; the knee centre stands de Leva's offset above
 * tibiale (ANSUR II's line on stature), across at the section's centre there,
 * the joint's centre midway between the epicondyles. At each tenth of the
 * thigh from the knee centre up toward the crotch (the pack's crotch cut),
 * the section's lateral and medial reach from that line gives the lateral
 * share of its breadth. Each share prints its mean and SD, no leg's value and
 * no curve.
 *
 * Limits: the leg length Hara regresses on (from the anterior superior iliac
 * spine) is stood for by the trochanterion height, so the hip centre's
 * lateral place carries about 0.086 of that difference.
 *
 * Scenarios:
 * 1. For each share of the thigh from the knee toward the crotch, prints the lateral share of the section's breadth about the femur's line.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads the private pack (`HumanReferenceSections`) and prints the aggregates; without the pack it prints that it did not run.
 * @evidence contracts/testing.md#independent-expectations No expectation: an estimate reading kept in its own removable file that no real test imports; the line comes from published laws, not from the curves.
 * @evidence contracts/testing.md#distinguishing-cases Both legs of two women and two men.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_estimate_thigh_split`, reading local files on the CPU, part of no acceptance.
 */
export function test_human_estimate_thigh_split(): void {
  const ids: string[] = HumanReferenceSections.available();
  if (ids.length === 0) {
    console.log("test_human_estimate_thigh_split: no private curve pack in .references/curves; nothing read");
    return;
  }
  const lateral: number[][] = SHARES.map((): number[] => []);
  for (const id of ids) {
    const sex: "f" | "m" = id.startsWith("f") ? "f" : "m";
    const marks: HumanReferenceSections.ILandmarks = HumanReferenceSections.landmarks(id);
    const S: number = marks.statureMm;
    const trochanterion: number = TROCHANTERION[sex].a + TROCHANTERION[sex].b * S;
    const hipY: number = trochanterion + HIP_OVER_TROCHANTERION[sex];
    const hipZ: number = 8 + 0.086 * trochanterion;
    const kneeY: number = TIBIALE[sex].a + TIBIALE[sex].b * S + KNEE_OVER_TIBIALE[sex];
    for (const [region, side] of [
      ["leg_l", 1],
      ["leg_r", -1],
    ] as const) {
      const rows: HumanReferenceSections.ISection[] = HumanReferenceSections.sections(id, region, [kneeY - 6, marks.crotchMm + 6]).filter((s: HumanReferenceSections.ISection): boolean => s.loops.length !== 0);
      if (rows.length < 3) continue;
      const loopAt = (y: number): HumanReferenceSections.IExtent => {
        const row: HumanReferenceSections.ISection = rows.reduce((a: HumanReferenceSections.ISection, b: HumanReferenceSections.ISection): HumanReferenceSections.ISection =>
          Math.abs(b.y - y) < Math.abs(a.y - y) ? b : a,
        );
        return row.loops.map(HumanReferenceSections.extent).reduce((a: HumanReferenceSections.IExtent, b: HumanReferenceSections.IExtent): HumanReferenceSections.IExtent => (b.girth > a.girth ? b : a));
      };
      const knee: V3 = loopAt(kneeY).centre;
      SHARES.forEach((share: number, k: number): void => {
        const y: number = kneeY + share * (marks.crotchMm - kneeY);
        const t: number = (y - kneeY) / (hipY - kneeY);
        const line: number = knee[2] + t * (side * hipZ - knee[2]);
        const e: HumanReferenceSections.IExtent = loopAt(y);
        const out: number = side > 0 ? e.z[1] - line : line - e.z[0];
        const inn: number = side > 0 ? line - e.z[0] : e.z[1] - line;
        if (out > 0 && inn > 0) lateral[k]!.push(out / (out + inn));
      });
    }
  }
  const T: typeof HumanSectionShape = HumanSectionShape;
  SHARES.forEach((share: number, k: number): void => console.log(`thigh share ${share.toFixed(1)}: lateral share of the breadth about the femur's line ${T.stat(lateral[k]!, 3)}`));
}
