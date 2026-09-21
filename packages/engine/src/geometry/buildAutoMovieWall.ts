/**
 * Partition a rectangular wall at its opening boundaries and emit only
 * exterior cell faces. The proceduralMesh export accepts metres in wall-local
 * XY, with depth along Z; output is centred on the wall. Opening records stay
 * caller-owned. Admission precedes the cell lattice so overlapping or pinched
 * openings cannot leave a partial result. Exact shared cuts keep adjacent cell
 * coordinates identical for downstream topology welding and budget accounting.
 */
import { IAutoMovieMesh } from "@automovie/interface";

import { finitePoint } from "./finitePoint";
import { positive } from "./positive";
import { IAutoMovieWallOpening } from "./IAutoMovieWallOpening";

/**
 * Build a local XY wall around rectangular door/window openings.
 *
 * The wall is partitioned at every opening edge, the cells an opening covers
 * are dropped, and each surviving cell contributes only the faces no
 * neighbouring cell hides. Openings therefore remain real holes in beauty,
 * depth, normal, and mask passes instead of metadata painted over an uncut
 * wall, and the standing wall is one closed 2-manifold solid.
 *
 * Dropping the hidden faces is what earns that. A union of one box per cell
 * carries an interior face between every adjacent pair, so each shared edge
 * belongs to four triangles; `validateMeshTopology` reads that as non-manifold
 * and `validateModel` therefore refuses any model carrying the wall, leaving a
 * builder whose own output the rest of the engine cannot accept. Those interior
 * faces are also triangles no camera can reach, and a budget counts them.
 *
 * Every cell corner is a lattice coordinate minus one half-extent, so the face
 * two adjacent cells share is the same pair of doubles read from both sides,
 * bit for bit. Deriving a corner from the cell's own centre and half-width
 * instead would round it, and two edges a rounding apart neither weld nor
 * cancel.
 *
 * Two openings that meet at a corner are refused rather than cut. The standing
 * region would touch itself along one line, and an edge four triangles share is
 * not a surface; separating it needs the general boolean this kernel does not
 * have, so it raises its own diagnostic instead of emitting a pinched solid.
 *
 * The result carries flat per-face normals and no texture coordinates. A cell
 * lattice is cut where the openings fall, so which cell a point belongs to is a
 * function of the opening list rather than of the wall, and an atlas laid on it
 * would shift under every opening the author moves. The atlas-bearing form is
 * [extrudeAutoMovieRegion](./proceduralRegionExtrusion.ts), whose outer ring is the panel and whose holes
 * are the openings: it cuts arbitrary outlines this one cannot, and its
 * coordinates come from the authored region rather than from the cut lattice.
 * Reach for that one whenever the wall carries a finish.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Constructs a wall and subtracts declared rectangular openings.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Emits the wall's closed topology after bounded opening operations.
 */
export const buildAutoMovieWall = (props: {
  width: number;
  height: number;
  depth: number;
  openings: readonly IAutoMovieWallOpening[];
}): IAutoMovieMesh => {
  positive(props.width, "wall width");
  positive(props.height, "wall height");
  positive(props.depth, "wall depth");
  const ids = new Set<string>();
  props.openings.forEach((opening, index) => {
    if (opening.id.trim().length === 0)
      throw new Error(`wall opening[${index}] id must be non-empty`);
    if (ids.has(opening.id))
      throw new Error(`wall opening id "${opening.id}" must be unique`);
    ids.add(opening.id);
    finiteOpening(opening, index);
    if (
      opening.x < 0 ||
      opening.y < 0 ||
      opening.x + opening.width > props.width ||
      opening.y + opening.height > props.height
    )
      throw new Error(`wall opening "${opening.id}" must stay inside the wall`);
  });
  for (let left = 0; left < props.openings.length; ++left)
    for (let right = left + 1; right < props.openings.length; ++right)
      if (overlaps(props.openings[left]!, props.openings[right]!))
        throw new Error(
          `wall openings "${props.openings[left]!.id}" and "${props.openings[right]!.id}" overlap`,
        );

  const xs = sortedCuts([
    0,
    props.width,
    ...props.openings.flatMap((opening) => [
      opening.x,
      opening.x + opening.width,
    ]),
  ]);
  const ys = sortedCuts([
    0,
    props.height,
    ...props.openings.flatMap((opening) => [
      opening.y,
      opening.y + opening.height,
    ]),
  ]);
  const columns = xs.length - 1;
  const rows = ys.length - 1;
  const standing: boolean[] = [];
  for (let x = 0; x < columns; ++x)
    for (let y = 0; y < rows; ++y) {
      const centerX = (xs[x]! + xs[x + 1]!) / 2;
      const centerY = (ys[y]! + ys[y + 1]!) / 2;
      standing.push(
        props.openings.every(
          (opening) =>
            centerX <= opening.x ||
            centerX >= opening.x + opening.width ||
            centerY <= opening.y ||
            centerY >= opening.y + opening.height,
        ),
      );
    }
  const stands = (x: number, y: number): boolean =>
    x >= 0 && y >= 0 && x < columns && y < rows && standing[x * rows + y]!;
  if (standing.some((cell) => cell) === false)
    throw new Error("wall openings remove the entire wall");
  for (let x = 1; x < columns; ++x)
    for (let y = 1; y < rows; ++y) {
      const lowerLeft = stands(x - 1, y - 1);
      const lowerRight = stands(x, y - 1);
      const upperLeft = stands(x - 1, y);
      const upperRight = stands(x, y);
      if (
        (lowerLeft && upperRight && !lowerRight && !upperLeft) ||
        (lowerRight && upperLeft && !lowerLeft && !upperRight)
      )
        throw new Error(
          `wall openings meet at (${xs[x]!}, ${ys[y]!}) and pinch the wall to a line`,
        );
    }

  const halfWidth = props.width / 2;
  const halfHeight = props.height / 2;
  const halfDepth = props.depth / 2;
  const target: { positions: number[]; normals: number[]; indices: number[] } =
    { positions: [], normals: [], indices: [] };
  for (let x = 0; x < columns; ++x)
    for (let y = 0; y < rows; ++y) {
      if (stands(x, y) === false) continue;
      const min = [
        xs[x]! - halfWidth,
        ys[y]! - halfHeight,
        -halfDepth,
      ] as const;
      const max = [
        xs[x + 1]! - halfWidth,
        ys[y + 1]! - halfHeight,
        halfDepth,
      ] as const;
      for (const [axis, outward, alongX, alongY] of WALL_CELL_SIDES)
        if (stands(x + alongX, y + alongY) === false)
          pushCellFace(target, min, max, axis, outward);
      pushCellFace(target, min, max, 2, 1);
      pushCellFace(target, min, max, 2, -1);
    }
  return {
    positions: target.positions,
    normals: target.normals,
    uvs: null,
    indices: target.indices,
    skin: null,
  };
};

/**
 * The four in-plane sides of a wall cell, each with the neighbour that hides
 * it. The two depth faces have no neighbour in a one-cell-deep wall and are
 * always emitted, so they are not listed.
 */
const WALL_CELL_SIDES: ReadonlyArray<
  readonly [axis: 0 | 1, outward: 1 | -1, alongX: number, alongY: number]
> = [
  [0, 1, 1, 0],
  [0, -1, -1, 0],
  [1, 1, 0, 1],
  [1, -1, 0, -1],
];

/**
 * Append one outward face of an axis-aligned cell, wound counter-clockwise seen
 * from outside.
 *
 * The two in-plane axes are taken in the cyclic order after the face's own
 * axis, so the corner cycle's right-hand normal IS the face's outward normal by
 * construction. A hand-written corner table would instead have to be kept in
 * step with the winding it claims, which is the kind of table that goes stale
 * without saying so.
 */
const pushCellFace = (
  target: { positions: number[]; normals: number[]; indices: number[] },
  min: readonly [number, number, number],
  max: readonly [number, number, number],
  axis: 0 | 1 | 2,
  outward: 1 | -1,
): void => {
  const u = (axis + 1) % 3;
  const v = (axis + 2) % 3;
  const plane = outward === 1 ? max[axis]! : min[axis]!;
  const corners: ReadonlyArray<readonly [number, number]> =
    outward === 1
      ? [
          [min[u]!, min[v]!],
          [max[u]!, min[v]!],
          [max[u]!, max[v]!],
          [min[u]!, max[v]!],
        ]
      : [
          [min[u]!, min[v]!],
          [min[u]!, max[v]!],
          [max[u]!, max[v]!],
          [max[u]!, min[v]!],
        ];
  const normal = [0, 0, 0];
  normal[axis] = outward;
  const base = target.positions.length / 3;
  for (const [alongU, alongV] of corners) {
    const point = [0, 0, 0];
    point[axis] = plane;
    point[u] = alongU;
    point[v] = alongV;
    target.positions.push(point[0]!, point[1]!, point[2]!);
    target.normals.push(normal[0]!, normal[1]!, normal[2]!);
  }
  target.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
};

const sortedCuts = (values: number[]): number[] =>
  [...new Set(values)].sort((left, right) => left - right);

const overlaps = (
  left: IAutoMovieWallOpening,
  right: IAutoMovieWallOpening,
): boolean =>
  left.x < right.x + right.width &&
  left.x + left.width > right.x &&
  left.y < right.y + right.height &&
  left.y + left.height > right.y;

const finiteOpening = (opening: IAutoMovieWallOpening, index: number): void => {
  finitePoint(opening, `wall opening[${index}]`);
  positive(opening.width, `wall opening[${index}] width`);
  positive(opening.height, `wall opening[${index}] height`);
};
