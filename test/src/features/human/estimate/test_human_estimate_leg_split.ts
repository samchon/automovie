import { HumanReferenceSections } from "../../internal/HumanReferenceSections";
import { HumanSectionShape } from "../../internal/HumanSectionShape";

type V3 = HumanReferenceSections.V3;

/** Mid-patella height per stature, ANSUR II women and men (0.276, 0.278; `docs/sources/ansur-ii.md`). */
const KNEE: Readonly<Record<"f" | "m", number>> = { f: 0.276, m: 0.278 };

/** Shares of the shank from the ankle cut (0) to the knee (1). */
const SHARES: readonly number[] = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

/**
 * An estimate reading, not a check: how the shank's breadth splits either side
 * of its bone line, from the private reference curves, aggregated over the
 * four people's eight legs.
 *
 * At the joints the bone line passes the section's centre (the knee's centre
 * midway between the epicondyles, the ankle's between the malleoli), so the
 * shank's bone line is read as the line from the ankle cut's section centre
 * to the knee's (ANSUR II's mid-patella share of stature). At each tenth
 * between, the section's lateral and medial reach from that line (its extent
 * along z, away from and toward the median plane) gives the lateral share of
 * its breadth. The thigh is not read: the hip joint's centre has no place on
 * the skin. Each share prints its mean and SD, no leg's value and no curve.
 *
 * Scenarios:
 * 1. For each share of the shank from the ankle to the knee, prints the lateral share of the section's breadth about the bone line.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads the private pack (`HumanReferenceSections`) and prints the aggregates; without the pack it prints that it did not run.
 * @evidence contracts/testing.md#independent-expectations No expectation: an estimate reading kept in its own removable file that no real test imports.
 * @evidence contracts/testing.md#distinguishing-cases Both legs of two women and two men.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_estimate_leg_split`, reading local files on the CPU, part of no acceptance.
 */
export function test_human_estimate_leg_split(): void {
  const ids: string[] = HumanReferenceSections.available();
  if (ids.length === 0) {
    console.log("test_human_estimate_leg_split: no private curve pack in .references/curves; nothing read");
    return;
  }
  const lateral: number[][] = SHARES.map((): number[] => []);
  for (const id of ids) {
    const marks: HumanReferenceSections.ILandmarks = HumanReferenceSections.landmarks(id);
    const knee: number = KNEE[id.startsWith("f") ? "f" : "m"] * marks.statureMm;
    for (const [region, cut, side] of [
      ["leg_l", marks.ankle_lMm, 1],
      ["leg_r", marks.ankle_rMm, -1],
    ] as const) {
      const rows: HumanReferenceSections.ISection[] = HumanReferenceSections.sections(id, region, [cut - 6, knee + 6]).filter((s: HumanReferenceSections.ISection): boolean => s.loops.length !== 0);
      if (rows.length < 3) continue;
      const loopAt = (y: number): HumanReferenceSections.IExtent => {
        const row: HumanReferenceSections.ISection = rows.reduce((a: HumanReferenceSections.ISection, b: HumanReferenceSections.ISection): HumanReferenceSections.ISection =>
          Math.abs(b.y - y) < Math.abs(a.y - y) ? b : a,
        );
        return row.loops.map(HumanReferenceSections.extent).reduce((a: HumanReferenceSections.IExtent, b: HumanReferenceSections.IExtent): HumanReferenceSections.IExtent => (b.girth > a.girth ? b : a));
      };
      const bottom: V3 = loopAt(cut).centre;
      const top: V3 = loopAt(knee).centre;
      SHARES.forEach((share: number, k: number): void => {
        const y: number = cut + share * (knee - cut);
        const e: HumanReferenceSections.IExtent = loopAt(y);
        const t: number = (y - bottom[1]) / (top[1] - bottom[1]);
        const line: number = bottom[2] + t * (top[2] - bottom[2]);
        const out: number = side > 0 ? e.z[1] - line : line - e.z[0];
        const inn: number = side > 0 ? line - e.z[0] : e.z[1] - line;
        if (out > 0 && inn > 0) lateral[k]!.push(out / (out + inn));
      });
    }
  }
  const S: typeof HumanSectionShape = HumanSectionShape;
  SHARES.forEach((share: number, k: number): void => console.log(`shank share ${share.toFixed(1)}: lateral share of the breadth about the bone line ${S.stat(lateral[k]!, 3)}`));
}
