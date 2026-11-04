import { HumanReferenceSections } from "../../internal/HumanReferenceSections";
import { HumanSectionShape } from "../../internal/HumanSectionShape";

type V3 = HumanReferenceSections.V3;

/** Shares of the foot's length from the heel. */
const SHARES: readonly number[] = Array.from({ length: 21 }, (_: unknown, i: number): number => i * 0.05);

/**
 * An estimate reading, not a check: the foot's top-view outline and side-view
 * heights along its length, from the private reference curves, normalized by
 * the foot's own length and aggregated over the reference feet.
 *
 * Each foot of f1, f2, m1 and m2 is read on its horizontal sections (the
 * pack's foot region, the floor to the ankle cut). Along the foot's axis, the
 * line from the heel's rearmost to the toe's foremost point in the floor
 * plane, at each twentieth of its length: the lateral and medial edges (the
 * greatest distances either side of the axis over every section's loop
 * across that place, the toes' loops included), and the dorsum's height (the
 * highest section with skin there) and the plantar contact's height (the
 * lowest), all per foot length. The mean and SD over the feet present is
 * printed, no foot's value and no curve.
 *
 * Scenarios:
 * 1. For each share of the foot's length from the heel, prints the lateral and medial edges and the dorsum and plantar heights, per foot length.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads the private pack (`HumanReferenceSections`) and prints the aggregate table; without the pack it prints that it did not run.
 * @evidence contracts/testing.md#independent-expectations No expectation: an estimate reading kept in its own removable file that no real test imports; the knot table it produces cites it and states its source as the private reference curves.
 * @evidence contracts/testing.md#distinguishing-cases Both feet of two women and two men; the sections stand 10 mm apart, so the heights are read to about 0.04 of the foot's length.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_estimate_foot_outline`, reading local files on the CPU, part of no acceptance.
 */
export function test_human_estimate_foot_outline(): void {
  const ids: string[] = HumanReferenceSections.available();
  if (ids.length === 0) {
    console.log("test_human_estimate_foot_outline: no private curve pack in .references/curves; nothing read");
    return;
  }
  const cells: number[][][] = SHARES.map((): number[][] => [[], [], [], []]);
  for (const id of ids)
    for (const [region, side] of [
      ["foot_l", 1],
      ["foot_r", -1],
    ] as const) {
      const rows: HumanReferenceSections.ISection[] = HumanReferenceSections.sections(id, region).filter((s: HumanReferenceSections.ISection): boolean => s.loops.length !== 0);
      const points: V3[] = rows.flatMap((s: HumanReferenceSections.ISection): V3[] => s.loops.flatMap((l: HumanReferenceSections.ILoop): V3[] => l.points));
      if (points.length === 0) continue;
      const heel: V3 = points.reduce((a: V3, b: V3): V3 => (b[0] < a[0] ? b : a));
      const toe: V3 = points.reduce((a: V3, b: V3): V3 => (b[0] > a[0] ? b : a));
      const ax: [number, number] = [toe[0] - heel[0], toe[2] - heel[2]];
      const length: number = Math.hypot(ax[0], ax[1]);
      const u: [number, number] = [ax[0] / length, ax[1] / length];

      // Along: the distance ahead of the heel on the axis; across: the
      // distance from the axis, positive lateral.
      const along = (p: V3): number => (p[0] - heel[0]) * u[0] + (p[2] - heel[2]) * u[1];
      const across = (p: V3): number => side * (-(p[0] - heel[0]) * u[1] + (p[2] - heel[2]) * u[0]);
      SHARES.forEach((share: number, k: number): void => {
        const at: number = share * length;
        let lateral: number = -Infinity;
        let medial: number = -Infinity;
        let dorsum: number = -Infinity;
        let plantar: number = Infinity;
        for (const s of rows)
          for (const l of s.loops) {
            const near: V3[] = l.points.filter((p: V3): boolean => Math.abs(along(p) - at) <= 4);
            if (near.length === 0) continue;
            for (const p of near) {
              lateral = Math.max(lateral, across(p));
              medial = Math.max(medial, -across(p));
            }
            dorsum = Math.max(dorsum, s.y);
            plantar = Math.min(plantar, s.y);
          }
        if (!Number.isFinite(dorsum)) return;
        cells[k]![0]!.push(lateral / length);
        cells[k]![1]!.push(medial / length);
        cells[k]![2]!.push(dorsum / length);
        cells[k]![3]!.push(plantar / length);
      });
    }
  const S: typeof HumanSectionShape = HumanSectionShape;
  SHARES.forEach((share: number, k: number): void => {
    const c: number[][] = cells[k]!;
    console.log(`foot share ${share.toFixed(2)}: lateral ${S.stat(c[0]!, 4)}, medial ${S.stat(c[1]!, 4)}, dorsum ${S.stat(c[2]!, 4)}, plantar ${S.stat(c[3]!, 4)} (per foot length)`);
  });
}
