import { IAutoMovieVector3 } from "@automovie/interface";

import { AUTOMOVIE_HUMAN_FOOT_GRID } from "./AUTOMOVIE_HUMAN_FOOT_GRID";
import { IAutoMovieHumanFootDraft } from "./IAutoMovieHumanFootDraft";
import { shapeAutoMovieHumanFootUpper } from "./shapeAutoMovieHumanFootUpper";

/**
 * Chart coordinate of a toe station's corners: the toe's root sits where the foot's chart reaches its front, 0.75 along, and the tip at 1. Grade: conventional layout choice.
 */
const TOE_CHART: Record<"root" | "tip", number> = { root: 0.75, tip: 1 };

/**
 * Knit a foot draft into the faces of the fixed foot topology, in the left foot's local frame.
 *
 * Faces wind counterclockwise seen from outside: the upper's about +y, the sole's about −y, the rims about their outward border, and each toe's sides about its own. The ankle hole's eight vertices are returned in the left foot's ring order, counterclockwise about +y from the anterior one, which is the ring layout's order for a left foot.
 *
 * Every corner gets an address on the foot's chart. `u` runs from the ankle ring (0) over the upper to its edge, 0.35 at the back of the heel and 0.75 at the toe roots, across the sole from 0.35 at the heel to 0.75 at the toe roots, and along each toe to 1 at its tip. `v` is the angle about the ankle, counterclockwise about the distal axis from the anterior mark, which on the upper of the left foot runs from the dorsal midline through the medial side (0.25) and the back (0.5) to the lateral side (0.75); the sole spans 0.3 to 0.7 from its medial edge to its lateral, and each toe's corners take the values of the root they grow from. The wrap meridian runs from the ring's anterior vertex down the dorsum's middle column to the web between the second and third toes, along vertices, so no face straddles it.
 *
 * @param draft The foot's control points, every slot filled
 * @returns Positions, faces, per-corner chart coordinates and the ring
 */
export function knitAutoMovieHumanFootCage(
  draft: IAutoMovieHumanFootDraft,
): knitAutoMovieHumanFootCage.IOutput {
  const { columns, rows, holeColumn, holeRow, toeStations } =
    AUTOMOVIE_HUMAN_FOOT_GRID;
  const positions: IAutoMovieVector3[] = [];
  const charts: knitAutoMovieHumanFootCage.IChart[] = [];
  const upper: number[][] = Array.from({ length: columns }, (): number[] =>
    new Array<number>(rows).fill(-1),
  );
  const sole: number[][] = Array.from({ length: columns }, (): number[] =>
    new Array<number>(rows).fill(-1),
  );
  const ring: number[] = new Array<number>(8).fill(-1);
  for (let i: number = 0; i < columns; ++i)
    for (let j: number = 0; j < rows; ++j) {
      const at: shapeAutoMovieHumanFootUpper.IPolar | null =
        shapeAutoMovieHumanFootUpper.polar(i, j);
      if (at === null) continue;
      upper[i]![j] = positions.push(draft.upper[i]![j]!) - 1;
      charts.push({
        u: at.fraction * (0.55 + 0.2 * Math.cos(at.angle)),
        v: wrap(-at.angle / (2 * Math.PI)),
      });
      if (at.fraction === 0)
        ring[Math.round((at.angle * 4) / Math.PI + 8) % 8] = upper[i]![j]!;
    }
  for (let i: number = 0; i < columns; ++i)
    for (let j: number = 0; j < rows; ++j) {
      sole[i]![j] = positions.push(draft.sole[i]![j]!) - 1;
      charts.push({
        u: 0.35 + (0.4 * j) / (rows - 1),
        v: 0.3 + (0.4 * i) / (columns - 1),
      });
    }

  const faces: Array<[number, number, number, number]> = [];
  const hole = (i: number, j: number): boolean =>
    i >= holeColumn && i < holeColumn + 2 && j >= holeRow && j < holeRow + 2;
  for (let i: number = 0; i < columns - 1; ++i)
    for (let j: number = 0; j < rows - 1; ++j) {
      if (!hole(i, j))
        faces.push([
          upper[i]![j]!,
          upper[i]![j + 1]!,
          upper[i + 1]![j + 1]!,
          upper[i + 1]![j]!,
        ]);
      faces.push([
        sole[i]![j]!,
        sole[i + 1]![j]!,
        sole[i + 1]![j + 1]!,
        sole[i]![j + 1]!,
      ]);
    }
  const last: number = columns - 1;
  const front: number = rows - 1;
  for (let j: number = 0; j < rows - 1; ++j) {
    faces.push([upper[0]![j]!, sole[0]![j]!, sole[0]![j + 1]!, upper[0]![j + 1]!]);
    faces.push([
      upper[last]![j]!,
      upper[last]![j + 1]!,
      sole[last]![j + 1]!,
      sole[last]![j]!,
    ]);
  }
  for (let i: number = 0; i < columns - 1; ++i) {
    faces.push([upper[i]![0]!, upper[i + 1]![0]!, sole[i + 1]![0]!, sole[i]![0]!]);
    if (i % 2 === 1)
      faces.push([
        upper[i]![front]!,
        sole[i]![front]!,
        sole[i + 1]![front]!,
        upper[i + 1]![front]!,
      ]);
  }
  const toes: number[][][] = [];
  draft.toes.forEach((stations: IAutoMovieVector3[][], t: number): void => {
    toes.push([]);
    const root: number[] = [
      upper[2 * t]![front]!,
      upper[2 * t + 1]![front]!,
      sole[2 * t + 1]![front]!,
      sole[2 * t]![front]!,
    ];
    let previous: number[] = root;
    stations.forEach((corners: IAutoMovieVector3[], s: number): void => {
      const u: number =
        TOE_CHART.root +
        ((TOE_CHART.tip - TOE_CHART.root) * (s + 1)) / toeStations.length;
      const next: number[] = corners.map((p: IAutoMovieVector3, c: number): number => {
        charts.push({ u, v: charts[root[c]!]!.v });
        return positions.push(p) - 1;
      });
      toes[t]!.push(next);
      for (let c: number = 0; c < 4; ++c)
        faces.push([
          previous[c]!,
          next[c]!,
          next[(c + 1) % 4]!,
          previous[(c + 1) % 4]!,
        ]);
      previous = next;
    });
    faces.push([previous[0]!, previous[3]!, previous[2]!, previous[1]!]);
  });
  return { positions, charts, faces, ring, toes };
}
/** Types of {@link knitAutoMovieHumanFootCage}. */
export namespace knitAutoMovieHumanFootCage {
  /**
   * A chart coordinate before it is attached to a face.
   *
   * @author Samchon
   */
  export interface IChart {
    /** Along the foot, 0 at the ankle ring and 1 at the toe tips. */
    u: number;

    /** Around the foot, 0 to 1. */
    v: number;
  }

  /**
   * The knitted foot in the left foot's local frame.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** Control points. */
    positions: IAutoMovieVector3[];

    /** Chart coordinate of each control point; the wrap meridian's vertices hold 0. */
    charts: IChart[];

    /** Quads wound counterclockwise seen from outside. */
    faces: Array<[number, number, number, number]>;

    /** The ankle hole's vertices, counterclockwise about +y from the anterior one. */
    ring: number[];

    /** Each toe's stations as vertex indices, hallux first, each station's corners as in the draft. */
    toes: number[][][];
  }
}

const wrap = (v: number): number => {
  const w: number = v - Math.floor(v);
  return Math.abs(w) < 1e-12 || Math.abs(w - 1) < 1e-12 ? 0 : w;
};
