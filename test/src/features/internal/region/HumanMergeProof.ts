import { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanMergeRows } from "./HumanMergeRows";

/**
 * The red and green proof of the merge rows on a made piece: a bump of 2 mm
 * and 14 mm radius, `2 cos^2(pi r / 28)`, whose edge vanishes with its slope
 * and bends at a 14 mm radius, passes; dented 0.5 mm at its centre it fails
 * the least height, cut at 10 mm it fails the edge rise (a 0.38 mm step), and
 * with a wide 0.2 mm skirt it fails the window's border.
 */
export namespace HumanMergeProof {
  /** The proof's failures, empty when it holds. */
  export function failures(): string[] {
    const grid: HumanMergeRows.IGrid = { u: [-20, 20], v: [-20, 20], step: 0.5, midline: false };
    const bump: HumanMergeRows.Height = (u: number, v: number): number => {
      const r: number = Math.hypot(u, v);
      return r < 14 ? 2 * Math.cos((Math.PI * r) / 28) ** 2 : 0;
    };
    const cases: [string, HumanMergeRows.Height, string][] = [
      ["dented", (u: number, v: number): number => bump(u, v) - (Math.hypot(u, v) < 5 ? 2.5 * Math.cos((Math.PI * Math.hypot(u, v)) / 10) ** 2 : 0), "least height"],
      ["cut", (u: number, v: number): number => (Math.hypot(u, v) < 10 ? bump(u, v) : 0), "largest rise"],
      ["skirted", (u: number, v: number): number => bump(u, v) + 0.2 * Math.exp(-(u * u + v * v) / 400), "border"],
    ];
    const out: string[] = HumanMergeRows.rows("made", "bump", bump, grid, 1)
      .filter((r: HumanAnatomyAudit.IRow): boolean => !HumanAnatomyAudit.passes(r))
      .map((r: HumanAnatomyAudit.IRow): string => `made bump must pass: ${r.site}: ${r.value}`);
    for (const [label, height, row] of cases) {
      const red: HumanAnatomyAudit.IRow[] = HumanMergeRows.rows("made", label, height, grid, 1).filter(
        (r: HumanAnatomyAudit.IRow): boolean => r.site.includes(row) && Number.isFinite(r.value) && !HumanAnatomyAudit.passes(r),
      );
      if (red.length === 0) out.push(`made ${label} bump must fail its ${row} row`);
    }
    return out;
  }
}
