import path from "node:path";
import { FamilyConicConvert as T } from "./FamilyConicConvert";
import { FamilyConicSource as R } from "./FamilyConicSource";
import { FamilyConicStar as S } from "./FamilyConicStar";

/**
 * The lids' region entry of the conversion tool, the +Z eye (the other is its reflection). The lids fold over the eyeball, so the trunk's
 * sections are not star-shaped there and its face, head and eyes nets fight over the socket (#3406): each alone turns 89.73, 42.89 and
 * 54.72 deg/mm at stations 813 to 816, and the brow's level bands are the fight's tail. On a course straight across the head behind the eye,
 * its sagittal planes cut the lids' skin in pieces star-shaped about the course at every station from z 20 to 43, 24 of 24
 * (`FamilyConicStar`, `test/.shots/family-conic-star/2026-11-14T03-52-32.322Z`). The reference's outermost loop bridges the palpebral
 * fissure, so the eyeball is a family of its own and these pieces are the lids' skin over it. Each piece is closed by its chord across the
 * region's box, handed to the tool as the section's closure.
 *
 * Run from `test` after bundling: `node <bundle>/FamilyConicConvertLids.cjs`.
 */
export namespace FamilyConicConvertLids {
  /** The lids' trial course and region: across the head along +z at 98 mm forward and 1,592 mm high, `u` forward. */
  export const TRIAL: S.ITrial = {
    label: "lids",
    centres: [
      [98, 1592, 12],
      [98, 1592, 56],
    ],
    up: [1, 0, 0],
    box: [95, 135, 1570, 1614, 12, 56],
    step: 1,
  };

  /** The stations the lids' pieces are star-shaped over, mm along the course (z 20 to 43). */
  export const STATIONS: [number, number] = [8, 31];

  /** The lids' course for the loft, as their sections read it; the frames are framed on the reference's +Z eye. */
  export const COURSE: T.ICourse = {
    centres: TRIAL.centres,
    halves: [],
    up: TRIAL.up,
    station: (s: number): number => s,
    depth: 1,
    zone: (p): boolean => p[0] > 0.09 && p[1] > 1.565 && p[1] < 1.62 && p[2] > 0.01 && p[2] < 0.06,
  };

  /** Convert, lay out, loft and render the lids. */
  export async function main(): Promise<void> {
    const source: R.ISource = await R.load(path.resolve(process.cwd(), ".."));
    const sections: T.ISection[] = S.regionSections(source, TRIAL, STATIONS[0], STATIONS[1]).map((section: S.IRegionSection): T.ISection => ({ s: section.s, points: section.points, closure: section.closure }));
    await T.report("lids", sections, { ladder: T.LADDER, note: `the +Z lids' sagittal sections on a course along +z behind the eye (${sections.length} stations), each closed by its chord across the box`, loft: COURSE });
  }
}

if (/FamilyConicConvertLids\.c?[jt]s$/.test(process.argv[1] ?? "")) T.run(FamilyConicConvertLids.main);
