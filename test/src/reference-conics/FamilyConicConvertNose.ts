import path from "node:path";
import { FamilyConicConvert as T } from "./FamilyConicConvert";
import { FamilyConicExcursion as X } from "./FamilyConicExcursion";
import type { FamilyConicSection as C } from "./FamilyConicSection";
import { FamilyConicSource as R } from "./FamilyConicSource";

/**
 * The nose's region entry of the conversion tool (#3401's proof): the 40 level sections of the `nose` excursion (1,542.5 to 1,582 mm, 1 mm
 * apart), each about the course point 11 mm in front of the excursion's origin on the median line (`FamilyConicBody.ts nose
 * --nose-vertical`), its guided closure (every point behind both of the skin's ends) passed to the tool as the closure the conversion
 * breaks at and does not count as skin.
 *
 * Run from `test` after bundling: `node <bundle>/FamilyConicConvertNose.cjs`.
 */
export namespace FamilyConicConvertNose {
  /** The course point in the excursion's chart, mm: 11 mm in front of its origin on the median line (`FamilyConicBody.ts nose --nose-vertical`). */
  export const POINT: C.P = [11, 0];

  /** The nose's sections in the course's chart, with their closures. */
  export async function sections(): Promise<T.ISection[]> {
    const part: X.IPart | undefined = X.PARTS.find((p: X.IPart): boolean => p.name === "nose");
    if (part === undefined) throw new Error("No nose excursion");
    const source: R.ISource = await R.load(path.resolve(process.cwd(), ".."));
    return X.sections(source, part)
      .filter((row): boolean => row.section !== null)
      .map((row): T.ISection => {
        const section: X.ISection = row.section!;
        const points: C.P[] = section.points.map((p: C.P): C.P => [p[0] - POINT[0], p[1] - POINT[1]]);
        if (section.ends === undefined) return { s: row.y, points };
        // The closure runs round the back (phase pi) from one skin end to the other, counter-clockwise.
        const [a, b] = section.ends.map((p: C.P): number => Math.atan2(p[1] - POINT[1], p[0] - POINT[0]));
        const wrap = (x: number): number => ((x % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const closure: [number, number] = wrap(Math.PI - a!) < wrap(b! - a!) ? [a!, b!] : [b!, a!];
        return { s: row.y, points, closure };
      });
  }

  /**
   * The nose's course for the loft: up the median plane through the course point, x 111 mm, from 1,536 to 1,590 mm high, its chart's `u`
   * forward (+x), so `v = u x t` is +z as in the excursion's chart and a section's station is its height less 1,536 mm. The frames are framed
   * on the reference's skin in front of the face (x past 95 mm) within 30 mm of the median plane over the loft's heights.
   */
  export const COURSE: T.ICourse = {
    centres: [
      [111, 1536, 0],
      [111, 1590, 0],
    ],
    halves: [],
    up: [1, 0, 0],
    station: (y: number): number => y - 1536,
    depth: 1,
    zone: (p): boolean => p[0] > 0.095 && p[1] > 1.5505 && p[1] < 1.5825 && Math.abs(p[2]) < 0.03,
  };

  /** Convert, lay out, loft and render the nose. */
  export async function main(): Promise<void> {
    await T.report("nose", await sections(), { note: "the nose excursion's level sections about [11, 0] in its chart (u forward, v to +z); arcs behind both skin ends are its invented closure", loft: COURSE });
  }
}

if (/FamilyConicConvertNose\.c?[jt]s$/.test(process.argv[1] ?? "")) T.run(FamilyConicConvertNose.main);
