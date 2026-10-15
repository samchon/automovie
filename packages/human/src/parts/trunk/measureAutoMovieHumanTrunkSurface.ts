import {
  IAutoMovieSubdivisionSurface,
  subdivideAutoMovieSurface,
} from "@automovie/engine";

import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanTrunkFrame } from "./IAutoMovieHumanTrunkFrame";

/** Subdivision levels of the measured surface: two levels put four surface points across every cage span. */
const LEVELS: number = 2;

/** Height step of the scans for the widest hip and the fullest chest, millimetres. */
const STEP: number = 4;

/**
 * Measure the trunk's surface as anthropometry measures a person: horizontal tape circumferences, which bridge hollows, and breadths and depths across the limit surface.
 *
 * The cage is subdivided and each measurement slices its limit surface with a horizontal plane. A tape circumference is the perimeter of the convex hull of the slice, the chest circumference the largest between the costal arch and just above the chest point (the bust, or the chest at the nipples), the hip breadth the widest slice between the gluteal furrow and the iliac crest, and the thigh circumference the left thigh's slice at the gluteal furrow.
 *
 * @param cage The trunk's cage
 * @param frame The left side's frame, for the levels
 * @param underbust Height of the underbust tape, the inframammary loop
 * @returns The measurements, millimetres
 */
export function measureAutoMovieHumanTrunkSurface(
  cage: IAutoMovieHumanCage,
  frame: IAutoMovieHumanTrunkFrame,
  underbust: number,
): measureAutoMovieHumanTrunkSurface.IOutput {
  const surface: IAutoMovieSubdivisionSurface = subdivideAutoMovieSurface({
    cage: {
      positions: cage.vertices.flatMap((v: IAutoMovieHumanCage.IVertex): number[] => [
        v.position.x,
        v.position.y,
        v.position.z,
      ]),
      faces: cage.faces.map((f: IAutoMovieHumanCage.IFace): number[] => [...f.vertices]),
    },
    levels: LEVELS,
  });
  const P: number[] = surface.limitPositions;
  const quads: number[] = surface.faces;
  const slice = (y: number, keep: (x: number) => boolean): Array<[number, number]> => {
    const out: Array<[number, number]> = [];
    for (let f: number = 0; f < quads.length; f += 4)
      for (let k: number = 0; k < 4; ++k) {
        const a: number = quads[f + k]!;
        const b: number = quads[f + ((k + 1) % 4)]!;
        const ya: number = P[a * 3 + 1]! - y;
        const yb: number = P[b * 3 + 1]! - y;
        if (ya < 0 === yb < 0) continue;
        const t: number = ya / (ya - yb);
        const x: number = P[a * 3]! + (P[b * 3]! - P[a * 3]!) * t;
        if (keep(x)) out.push([x, P[a * 3 + 2]! + (P[b * 3 + 2]! - P[a * 3 + 2]!) * t]);
      }
    return out;
  };
  const section = (y: number, keep: (x: number) => boolean = (): boolean => true): ISection => {
    const points: Array<[number, number]> = slice(y, keep);
    const extent = (k: 0 | 1): number => {
      let low: number = Infinity;
      let high: number = -Infinity;
      for (const p of points) {
        low = Math.min(low, p[k]);
        high = Math.max(high, p[k]);
      }
      return points.length === 0 ? 0 : high - low;
    };
    return { girth: hull(points), breadth: extent(0), depth: extent(1) };
  };
  const L: IAutoMovieHumanTrunkFrame.ILevels = frame.levels;
  let chest: ISection = section(L.costal);
  for (let y: number = L.costal; y <= L.chestPoint + 0.025 * frame.stature; y += STEP) {
    const s: ISection = section(y);
    if (s.girth > chest.girth) chest = s;
  }
  let hip: number = 0;
  for (let y: number = L.gluteal + STEP; y <= frame.iliocristale.y; y += STEP)
    hip = Math.max(hip, section(y).breadth);
  const buttock: ISection = section(L.buttock);
  return {
    chest,
    underbust: section(underbust).girth,
    waist: section(L.waist),
    buttock: { girth: buttock.girth, breadth: hip, depth: buttock.depth },
    thigh: section(L.gluteal, (x: number): boolean => x > 0).girth,
  };
}
/** Output type of {@link measureAutoMovieHumanTrunkSurface}. */
export namespace measureAutoMovieHumanTrunkSurface {
  /**
   * The trunk's measured surface.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** Fullest chest section between the costal arch and the chest point. */
    chest: ISection;

    /** Underbust circumference. */
    underbust: number;

    /** Natural waist section. */
    waist: ISection;

    /** Buttock circumference and depth, with the widest hip breadth. */
    buttock: ISection;

    /** Left thigh circumference at the gluteal furrow. */
    thigh: number;
  }
}

/** One horizontal section's tape girth, breadth and depth. */
interface ISection {
  girth: number;
  breadth: number;
  depth: number;
}

/** Perimeter of the convex hull of planar points, Andrew's monotone chain, which is what a tape spans. */
const hull = (points: Array<[number, number]>): number => {
  if (points.length < 3) return 0;
  const sorted: Array<[number, number]> = [...points].sort(
    (a: [number, number], b: [number, number]): number => a[0] - b[0] || a[1] - b[1],
  );
  const turn = (o: [number, number], a: [number, number], b: [number, number]): number =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const chain = (list: Array<[number, number]>): Array<[number, number]> => {
    const out: Array<[number, number]> = [];
    for (const p of list) {
      while (out.length >= 2 && turn(out[out.length - 2]!, out[out.length - 1]!, p) <= 0)
        out.pop();
      out.push(p);
    }
    return out.slice(0, -1);
  };
  const ring: Array<[number, number]> = [
    ...chain(sorted),
    ...chain([...sorted].reverse()),
  ];
  let perimeter: number = 0;
  ring.forEach((p: [number, number], i: number): void => {
    const q: [number, number] = ring[(i + 1) % ring.length]!;
    perimeter += Math.hypot(q[0] - p[0], q[1] - p[1]);
  });
  return perimeter;
};
