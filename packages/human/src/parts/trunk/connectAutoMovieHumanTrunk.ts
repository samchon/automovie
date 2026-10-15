import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanSide } from "../../junction/AutoMovieHumanSide";
import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanRing } from "../../junction/IAutoMovieHumanRing";
import { IAutoMovieHumanSurfaceCoordinate } from "../../junction/IAutoMovieHumanSurfaceCoordinate";
import { IAutoMovieHumanTrunkPoints } from "./IAutoMovieHumanTrunkPoints";

/** Torso loops and columns. */
const LOOPS: number = 13;
const COLUMNS: number = 24;

/** Loops whose side columns bound the arm opening: the axilla, the mid shoulder and the top edge. */
const ARM_LOOPS: [number, number, number] = [10, 11, 12];

/**
 * The arm opening of the left side as torso slots `[loop, column]` in the upper arm ring's layout order: front, front-below (the anterior axillary fold), below (the armpit), back-below (the posterior fold), back, back-above, above (the acromion), front-above.
 */
const ARM_OPENING: Array<[number, number]> = [
  [11, 5],
  [10, 5],
  [10, 6],
  [10, 7],
  [11, 7],
  [12, 7],
  [12, 6],
  [12, 5],
];

/**
 * The thigh opening of the left side in the thigh ring's layout order: loop 0 columns, or `null` for the perineum's left vertex. Front, then medially round to the back and up the lateral side.
 */
const LEG_OPENING: Array<number | null> = [3, 2, 1, null, 11, 10, 9, 8, 7, 6, 5, 4];

/**
 * Connect the trunk's points into its quad cage: one fixed topology for every person.
 *
 * The torso is a tube of thirteen loops by twenty-four columns. Its top is closed by a ten-by-two grid over the shoulders, the clavicle line in front, the trapezius crest in the middle and the back edge behind, with the neck base opening as its middle four-by-two block; its bottom by a two-by-two perineal strip between the thigh openings. Each arm opens through a two-by-two block of side faces at the shoulder and runs four rings out to mid upper arm; each thigh opens around loop 0 and the perineum's side and runs three rings to mid thigh.
 *
 * Extraordinary vertices are placed where curvature is high anyway (OpenSubdiv documentation, "Modeling Tips"): the four corners of each arm opening that meet the torso's columns are the anterior and posterior axillary folds, valence 5; the thigh openings' medial corners in front and behind are valence 5 at the pubis and the natal cleft; the neck opening's four corners become valence 5 at the sternoclavicular joints and beside the seventh cervical vertebra once the neck joins. The cube-like corners of the shoulder and pelvis grids all fall on openings, so no valence 3 vertex remains.
 *
 * The chart runs `u` up the torso from the perineum (0) to the shoulder grid (1) and `v` counterclockwise about +Y from the anterior midline, so the arm and thigh openings are regions of it; each stub's rings shrink toward its opening's centre in the chart.
 *
 * Rings, in order: `neckBase`, `upperArm` left and right, `thigh` left and right.
 *
 * @param points The placed points
 * @returns The cage
 */
export function connectAutoMovieHumanTrunk(
  points: IAutoMovieHumanTrunkPoints,
): IAutoMovieHumanCage {
  const vertices: IAutoMovieHumanCage.IVertex[] = [];
  const chart: Array<{ u: number; v: number }> = [];
  const add = (position: IAutoMovieVector3, u: number, v: number): number => {
    vertices.push({ position });
    chart.push({ u, v: ((v % 1) + 1) % 1 });
    return vertices.length - 1;
  };
  const height = (i: number): number => (i + 1) / (LOOPS + 1);
  const loop: number[][] = points.loops.map(
    (row: IAutoMovieVector3[], i: number): number[] =>
      row.map((p: IAutoMovieVector3, j: number): number =>
        i === ARM_LOOPS[1] && (j === 6 || j === 18) ? -1 : add(p, height(i), j / COLUMNS),
      ),
  );
  const ridge: number[] = points.ridge.map((p: IAutoMovieVector3, k: number): number => {
    const c: number = k - 4;
    if (Math.abs(c) <= 1) return -1;
    const v: number = c > 0 ? 0.25 * (1 - (c - 2) / 6) : 0.75 + 0.25 * ((-c - 2) / 6);
    return add(p, (LOOPS + 0.5) / (LOOPS + 1), v);
  });
  const perineum: number[] = points.perineum.map(
    (p: IAutoMovieVector3, k: number): number => add(p, 0, (k - 1) / COLUMNS),
  );

  const faces: IAutoMovieHumanCage.IFace[] = [];
  const face = (q: [number, number, number, number]): void => {
    const corners: Array<{ u: number; v: number }> = q.map(
      (i: number): { u: number; v: number } => chart[i]!,
    );
    const vs: number[] = corners.map((c: { u: number; v: number }): number => c.v);
    const wrap: boolean = Math.max(...vs) - Math.min(...vs) > 0.5;
    faces.push({
      vertices: q,
      coordinates: corners.map(
        (c: { u: number; v: number }): IAutoMovieHumanSurfaceCoordinate => ({
          part: "trunk",
          side: null,
          u: c.u,
          v: wrap && c.v < 0.5 ? c.v + 1 : c.v,
        }),
      ) as IAutoMovieHumanCage.IFace["coordinates"],
    });
  };

  // the torso's sides
  for (let i: number = 0; i < LOOPS - 1; ++i)
    for (let j: number = 0; j < COLUMNS; ++j) {
      const opening: boolean =
        (i === ARM_LOOPS[0] || i === ARM_LOOPS[1]) &&
        (j === 5 || j === 6 || j === 17 || j === 18);
      if (opening) continue;
      const k: number = (j + 1) % COLUMNS;
      face([loop[i]![j]!, loop[i]![k]!, loop[i + 1]![k]!, loop[i + 1]![j]!]);
    }
  // the shoulder grid, c from right (-5) to left (5) and r from the front (0) to the back (2)
  const top: number[] = loop[LOOPS - 1]!;
  const shoulder = (c: number, r: number): number => {
    if (r === 0) return top[(c + COLUMNS) % COLUMNS]!;
    if (r === 2) return top[(12 - c + COLUMNS) % COLUMNS]!;
    if (c === 5) return top[6]!;
    if (c === -5) return top[18]!;
    return ridge[c + 4]!;
  };
  for (let c: number = -5; c < 5; ++c) {
    if (c >= -2 && c <= 1) continue;
    for (let r: number = 0; r < 2; ++r)
      face([shoulder(c, r), shoulder(c + 1, r), shoulder(c + 1, r + 1), shoulder(c, r + 1)]);
  }
  // the perineal strip
  const bottom = (c: number, r: number): number => {
    if (r === 0) return loop[0]![(c + COLUMNS) % COLUMNS]!;
    if (r === 2) return loop[0]![(12 - c + COLUMNS) % COLUMNS]!;
    return perineum[c + 1]!;
  };
  for (let c: number = -1; c < 1; ++c)
    for (let r: number = 0; r < 2; ++r)
      face([bottom(c, r), bottom(c, r + 1), bottom(c + 1, r + 1), bottom(c + 1, r)]);

  // stubs: each opening in the layout order of its side, then the rings outward
  const stub = (
    opening: number[],
    rings: IAutoMovieVector3[][],
    centre: { u: number; v: number },
  ): number[] => {
    let previous: number[] = opening;
    rings.forEach((ring: IAutoMovieVector3[], r: number): void => {
      const shrink: number = 1 - (r + 1) / (rings.length + 1);
      const next: number[] = ring.map((p: IAutoMovieVector3, k: number): number => {
        const c: { u: number; v: number } = chart[opening[k]!]!;
        const dv: number = ((c.v - centre.v + 1.5) % 1) - 0.5;
        return add(p, centre.u + (c.u - centre.u) * shrink, centre.v + dv * shrink);
      });
      const n: number = ring.length;
      for (let k: number = 0; k < n; ++k)
        face([previous[k]!, previous[(k + 1) % n]!, next[(k + 1) % n]!, next[k]!]);
      previous = next;
    });
    return previous;
  };
  const sided = (side: AutoMovieHumanSide, slots: number[]): number[] =>
    side === "left" ? slots : [slots[0]!, ...slots.slice(1).reverse()];
  const mirror = (j: number): number => (COLUMNS - j) % COLUMNS;
  const rings: IAutoMovieHumanRing[] = [
    {
      site: "neckBase",
      side: null,
      vertices: [0, 1, 2, -2, 10, 11, 12, 13, 14, -9, 22, 23].map((j: number): number =>
        j === -2 ? ridge[6]! : j === -9 ? ridge[2]! : top[j]!,
      ),
      start: "anterior",
      frame: points.layouts.neck.frame,
    },
  ];
  for (const side of ["left", "right"] as const) {
    const opening: number[] = sided(
      side,
      ARM_OPENING.map(([i, j]: [number, number]): number =>
        loop[i]![side === "left" ? j : mirror(j)]!,
      ),
    );
    const end: number[] = stub(opening, points.arms[side], {
      u: height(ARM_LOOPS[1]),
      v: side === "left" ? 0.25 : 0.75,
    });
    rings.push({
      site: "upperArm",
      side,
      vertices: end,
      start: "anterior",
      frame: points.layouts.arm[side].frame,
    });
  }
  for (const side of ["left", "right"] as const) {
    const opening: number[] = sided(
      side,
      LEG_OPENING.map((j: number | null): number =>
        j === null ? perineum[side === "left" ? 2 : 0]! : loop[0]![side === "left" ? j : mirror(j)]!,
      ),
    );
    const end: number[] = stub(opening, points.legs[side], {
      u: 0.5 / (LOOPS + 1),
      v: side === "left" ? 0.25 : 0.75,
    });
    rings.push({
      site: "thigh",
      side,
      vertices: end,
      start: "anterior",
      frame: points.layouts.thigh[side].frame,
    });
  }
  return { vertices, faces, creases: [], rings };
}
