import { HumanReferenceSections } from "../../internal/HumanReferenceSections";

/** Shares of the ankle-to-crotch span the reading reports, ankle 0, crotch 1. */
const SHARES: readonly number[] = [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95];

/**
 * An estimate reading, not a check: the leg section's breadth over depth and
 * its fullness in its box along the leg, aggregated over the private
 * reference set, for the leg's width-to-depth law where no published source
 * was found.
 *
 * Each leg (both sides of f1, f2, m1 and m2) is read on its horizontal
 * sections between the pack's ankle and crotch cuts (the region's lowest and
 * highest sections); at each share of that span, the section's largest loop
 * gives its breadth (z extent), depth (x extent) and taut-tape girth, the
 * breadth over depth, and the girth's place in the box range (0 the rhombus
 * `2 sqrt(W^2 + D^2)`, 1 the box `2 (W + D)`). Only the ratios' mean and SD
 * over the eight legs are printed; no person's value and no curve is printed
 * or stored. The legs stand near vertical, so the horizontal section stands
 * for the section normal to the leg within the cosine of its lean.
 *
 * Scenarios:
 * 1. For each share of the ankle-to-crotch span, prints the breadth over depth and the fullness, mean and SD over every leg present.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads the private pack (`HumanReferenceSections`) when present, measures each section's loop and prints the aggregates; without the pack it prints that it did not run.
 * @evidence contracts/testing.md#independent-expectations No expectation: an estimate reading kept in its own removable file that no real test imports; the law it informs cites it by name and states that no published source was found.
 * @evidence contracts/testing.md#distinguishing-cases Both legs of two women and two men; the spread shows how far one share stands for the set.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_estimate_leg_sections`, reading local files on the CPU, part of no acceptance.
 */
export function test_human_estimate_leg_sections(): void {
  const ids: string[] = HumanReferenceSections.available();
  if (ids.length === 0) {
    console.log("test_human_estimate_leg_sections: no private curve pack in .references/curves; nothing read");
    return;
  }
  const ratio: number[][] = SHARES.map((): number[] => []);
  const fullness: number[][] = SHARES.map((): number[] => []);
  for (const id of ids)
    for (const region of ["leg_l", "leg_r"]) {
      const rows: HumanReferenceSections.ISection[] = HumanReferenceSections.sections(id, region).filter((s: HumanReferenceSections.ISection): boolean => s.loops.length !== 0);
      if (rows.length < 2) continue;
      const bottom: number = rows[0]!.y;
      const top: number = rows[rows.length - 1]!.y;
      SHARES.forEach((share: number, k: number): void => {
        const y: number = bottom + share * (top - bottom);
        const row: HumanReferenceSections.ISection = rows.reduce((a: HumanReferenceSections.ISection, b: HumanReferenceSections.ISection): HumanReferenceSections.ISection =>
          Math.abs(b.y - y) < Math.abs(a.y - y) ? b : a,
        );
        const loops: HumanReferenceSections.IExtent[] = row.loops.map(HumanReferenceSections.extent);
        const e: HumanReferenceSections.IExtent = loops.reduce((a: HumanReferenceSections.IExtent, b: HumanReferenceSections.IExtent): HumanReferenceSections.IExtent => (b.girth > a.girth ? b : a));
        const w: number = e.z[1] - e.z[0];
        const d: number = e.x[1] - e.x[0];
        const rhombus: number = 2 * Math.hypot(w, d);
        ratio[k]!.push(w / d);
        fullness[k]!.push((e.girth - rhombus) / (2 * (w + d) - rhombus));
      });
    }
  const stat = (v: number[]): string => {
    const m: number = v.reduce((a: number, b: number): number => a + b, 0) / v.length;
    const sd: number = Math.sqrt(v.reduce((a: number, b: number): number => a + (b - m) ** 2, 0) / Math.max(1, v.length - 1));
    return `${m.toFixed(3)} (${sd.toFixed(3)})`;
  };
  SHARES.forEach((share: number, k: number): void => {
    console.log(`leg share ${share.toFixed(2)}: breadth over depth ${stat(ratio[k]!)}, fullness ${stat(fullness[k]!)}, legs ${ratio[k]!.length}`);
  });
}
