import path from "node:path";
import { FamilyConicConvert as T } from "./FamilyConicConvert";
import { FamilyConicSource as R } from "./FamilyConicSource";
import { FamilyConicStar as S } from "./FamilyConicStar";

/**
 * The chin's region entry of the conversion tool. The trunk's level sections fold under the chin (the overhang at stations 696 to 716,
 * the knot-708 step), so the chin is a family of its own, merged on the trunk (construction.md, Connections). On a course straight forward
 * through the chin, its frontal planes cut the chin's skin in pieces star-shaped about the course at every station from 70 to 99 mm forward,
 * 30 of 30 (`FamilyConicStar`, `test/.shots/family-conic-star/2026-11-14T03-52-32.322Z`); forward and down at 45 degrees one folded and
 * sixteen fell outside, and on sagittal planes twelve folded. Each piece is closed by its chord across the region's box, handed to the tool
 * as the section's closure.
 *
 * Run from `test` after bundling: `node <bundle>/FamilyConicConvertChin.cjs`.
 */
export namespace FamilyConicConvertChin {
  /** The chin's trial course and its region: straight forward along +x at 1,478 mm high on the median plane, `u` up. */
  export const TRIAL: S.ITrial = {
    label: "chin",
    centres: [
      [70, 1478, 0],
      [120, 1478, 0],
    ],
    up: [0, 1, 0],
    box: [70, 120, 1448, 1508, -35, 35],
    step: 1,
  };

  /** The stations the chin's pieces are star-shaped over, mm along the course (x 70 to 99). */
  export const STATIONS: [number, number] = [0, 29];

  /** The chin's course for the loft, as its sections read it; the frames are framed on the reference's chin. */
  export const COURSE: T.ICourse = {
    centres: TRIAL.centres,
    halves: [],
    up: TRIAL.up,
    station: (s: number): number => s,
    depth: 1,
    zone: (p): boolean => p[0] > 0.07 && p[0] < 0.125 && p[1] > 1.445 && p[1] < 1.51 && Math.abs(p[2]) < 0.04,
  };

  /** Convert, lay out, loft and render the chin. */
  export async function main(): Promise<void> {
    const source: R.ISource = await R.load(path.resolve(process.cwd(), ".."));
    const sections: T.ISection[] = S.regionSections(source, TRIAL, STATIONS[0], STATIONS[1]).map((section: S.IRegionSection): T.ISection => ({ s: section.s, points: section.points, closure: section.closure }));
    await T.report("chin", sections, { ladder: T.LADDER, note: `the chin's frontal sections on a course along +x at 1,478 mm (${sections.length} stations), each closed by its chord across the box`, loft: COURSE });
  }
}

if (/FamilyConicConvertChin\.c?[jt]s$/.test(process.argv[1] ?? "")) T.run(FamilyConicConvertChin.main);
