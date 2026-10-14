import { IAutoMovieMesh } from "@automovie/interface";

import { ITessellation } from "./ITessellation";
import { IAutoMovieWallOpening } from "./IAutoMovieWallOpening";
import { finitePoint } from "./finitePoint";
import { positive } from "./positive";

/**
 * Build a rectangular wall in local XY, depth along Z, with rectangular door and window openings cut through it.
 *
 * The wall is partitioned at every opening edge, the cells an opening covers are dropped, and each standing cell emits only the faces no standing neighbour hides. Openings are therefore real holes in beauty, depth, normal and mask passes rather than metadata over an uncut wall, and the standing wall is a closed 2-manifold: a union of one box per cell would leave an interior face between every adjacent pair, an edge shared by four triangles that `validateMeshTopology`, and so `validateModel`, refuses, plus triangles no camera reaches that a budget still counts.
 *
 * Every cell corner is a lattice coordinate minus one half-extent, so the face two adjacent cells share reads the same pair of doubles from both sides and welds exactly. The result is centred on the wall and spans `-depth / 2` to `+depth / 2`; it carries flat per-face normals and no texture coordinates, because which cell a point belongs to depends on the opening list, and an atlas laid on that lattice would shift whenever an opening moves. `extrudeAutoMovieRegion`, with the panel as its outer ring and the openings as holes, is the atlas-bearing form that also cuts arbitrary outlines.
 *
 * All openings are admitted before the lattice is built, so a refusal never leaves a partial mesh. Refused: a nonpositive or non-finite wall size; an opening with a blank or repeated id, a non-finite origin, a nonpositive size, or a rectangle outside the wall; two overlapping openings; openings meeting only at a corner, which would pinch the wall to a line that needs a general boolean this kernel does not have; and openings that remove the whole wall. Opening records are only read.
 *
 * @param props.width Wall width along X in metres.
 * @param props.height Wall height along Y in metres.
 * @param props.depth Wall thickness along Z in metres.
 * @param props.openings Rectangles to cut, in wall-local metres from the bottom-left corner.
 * @returns A closed mesh with flat normals and no UVs.
 *
 * @evidence contracts/common.md#principled-implementation Sorted distinct opening edges partition the wall into rectilinear cells classified at their centres; emit faces only between standing and removed/outside cells, the boundary of their union. Admission excludes overlaps and corner pinches, while binary64 midpoint arithmetic and the downstream weld grid limit representable detail; finite scalar admission alone is not an arbitrary-scale topology certificate.
 * @evidence contracts/common.md#clear-and-simple-design Admission, the lattice and face emission are one pass each in this function, with `pushCellFace` deriving each face's corner order from its axis so no hand-written corner table can drift from the winding.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Pinched and overlapping openings are refused by name instead of being nudged apart or merged, and corners come from shared lattice values rather than from rounded per-cell centres.
 * @evidence contracts/common.md#meaningful-documentation States the frame and extent, why hidden faces are dropped, the exact-weld rule, why there are no UVs and what to use instead, every refusal and that admission precedes output.
 * @evidence contracts/performance.md#efficient-algorithms For k openings the lattice has at most (2k+1)^2 cells; overlap admission is O(k^2), cut sorting O(k log k), standing classification O(k) per cell and emission constant per cell. The worst case is cubic in openings, with no workload cap or measured speed claim.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One mesh per wall description; a caller placing identical walls can keep the returned mesh.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns new position, normal and index arrays bounded by six quads per standing cell; the id set, cut lists and standing flags are released on return.
 * @author Samchon
 */
export const buildAutoMovieWall: (props: { width: number; height: number; depth: number; openings: readonly IAutoMovieWallOpening[]; }) => IAutoMovieMesh = (props: {
  /** Wall width along X, in metres. */
  width: number;

  /** Wall height along Y, in metres. */
  height: number;

  /** Wall thickness along Z, in metres. */
  depth: number;

  /** Rectangles to cut, from the wall's bottom-left corner. */
  openings: readonly IAutoMovieWallOpening[];
}): IAutoMovieMesh => {
  positive(props.width, "wall width");
  positive(props.height, "wall height");
  positive(props.depth, "wall depth");
  const ids: Set<string> = new Set();
  props.openings.forEach((opening: IAutoMovieWallOpening, index: number): void => {
    if (opening.id.trim().length === 0)
      throw new Error(`wall opening[${index}] id must be non-empty`);
    if (ids.has(opening.id))
      throw new Error(`wall opening id "${opening.id}" must be unique`);
    ids.add(opening.id);
    finitePoint(opening, `wall opening[${index}]`);
    positive(opening.width, `wall opening[${index}] width`);
    positive(opening.height, `wall opening[${index}] height`);
    if (
      opening.x < 0 ||
      opening.y < 0 ||
      opening.x + opening.width > props.width ||
      opening.y + opening.height > props.height
    )
      throw new Error(`wall opening "${opening.id}" must stay inside the wall`);
  });
  for (let left: number = 0; left < props.openings.length; ++left)
    for (let right: number = left + 1; right < props.openings.length; ++right)
      if (overlaps(props.openings[left]!, props.openings[right]!))
        throw new Error(
          `wall openings "${props.openings[left]!.id}" and "${props.openings[right]!.id}" overlap`,
        );

  const xs: number[] = sortedCuts(
    props.width,
    props.openings.flatMap((opening: IAutoMovieWallOpening): number[] => [
      opening.x,
      opening.x + opening.width,
    ]),
  );
  const ys: number[] = sortedCuts(
    props.height,
    props.openings.flatMap((opening: IAutoMovieWallOpening): number[] => [
      opening.y,
      opening.y + opening.height,
    ]),
  );
  const columns: number = xs.length - 1;
  const rows: number = ys.length - 1;
  const standing: boolean[] = [];
  for (let x: number = 0; x < columns; ++x)
    for (let y: number = 0; y < rows; ++y) {
      const centerX: number = (xs[x]! + xs[x + 1]!) / 2;
      const centerY: number = (ys[y]! + ys[y + 1]!) / 2;
      standing.push(
        props.openings.every(
          (opening: IAutoMovieWallOpening): boolean =>
            centerX <= opening.x ||
            centerX >= opening.x + opening.width ||
            centerY <= opening.y ||
            centerY >= opening.y + opening.height,
        ),
      );
    }
  const stands: (x: number, y: number) => boolean = (x: number, y: number): boolean =>
    x >= 0 && y >= 0 && x < columns && y < rows && standing[x * rows + y]!;
  if (standing.some((cell: boolean): boolean => cell) === false)
    throw new Error("wall openings remove the entire wall");
  for (let x: number = 1; x < columns; ++x)
    for (let y: number = 1; y < rows; ++y) {
      const lowerLeft: boolean = stands(x - 1, y - 1);
      const lowerRight: boolean = stands(x, y - 1);
      const upperLeft: boolean = stands(x - 1, y);
      const upperRight: boolean = stands(x, y);
      if (
        (lowerLeft && upperRight && !lowerRight && !upperLeft) ||
        (lowerRight && upperLeft && !lowerLeft && !upperRight)
      )
        throw new Error(
          `wall openings meet at (${xs[x]!}, ${ys[y]!}) and pinch the wall to a line`,
        );
    }

  const halfWidth: number = props.width / 2;
  const halfHeight: number = props.height / 2;
  const halfDepth: number = props.depth / 2;
  const target: ITessellation = { positions: [], normals: [], indices: [] };
  for (let x: number = 0; x < columns; ++x)
    for (let y: number = 0; y < rows; ++y) {
      if (stands(x, y) === false) continue;
      const min: readonly [number, number, number] = [
        xs[x]! - halfWidth,
        ys[y]! - halfHeight,
        -halfDepth,
      ];
      const max: readonly [number, number, number] = [
        xs[x + 1]! - halfWidth,
        ys[y + 1]! - halfHeight,
        halfDepth,
      ];
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
 * The four in-plane sides of a wall cell, each with the neighbour that hides it. The two depth faces have no neighbour in a one-cell-deep wall and are always emitted, so they are not listed.
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
 * Append one outward face of an axis-aligned cell, wound counter-clockwise seen from outside.
 *
 * The two in-plane axes are taken in the cyclic order after the face's own axis, so the corner cycle's right-hand normal is the face's outward normal by construction rather than by a corner table kept in step with it.
 *
 * Borrow the admitted cell extremes and append four corners/normals plus two triangles to the caller's tessellation. Constant per-face scratch arrays are released immediately; only appended buffers survive, with no cached face or wall-specific case.
 */
const pushCellFace: (target: ITessellation, min: readonly [number, number, number], max: readonly [number, number, number], axis: 0 | 1 | 2, outward: 1 | -1) => void = (
  target: ITessellation,
  min: readonly [number, number, number],
  max: readonly [number, number, number],
  axis: 0 | 1 | 2,
  outward: 1 | -1,
): void => {
  const u: number = (axis + 1) % 3;
  const v: number = (axis + 2) % 3;
  const plane: number = outward === 1 ? max[axis] : min[axis];
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
  const normal: number[] = [0, 0, 0];
  normal[axis] = outward;
  const base: number = target.positions.length / 3;
  for (const [alongU, alongV] of corners) {
    const point: number[] = [0, 0, 0];
    point[axis] = plane;
    point[u] = alongU;
    point[v] = alongV;
    target.positions.push(point[0]!, point[1]!, point[2]!);
    target.normals.push(normal[0]!, normal[1]!, normal[2]!);
  }
  target.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
};

/** Sort the wall ends and authored opening edges numerically after exact Set deduplication. Admitted finite edges are the premise; no tolerance weld or coordinate repair changes them. O(E log E) time/O(E) new list storage returns to the wall call without retained state. */
const sortedCuts: (extent: number, edges: readonly number[]) => number[] = (extent: number, edges: readonly number[]): number[] =>
  [...new Set([0, extent, ...edges])].sort(
    (a: number, b: number): number => a - b,
  );

/** Compare strict overlap on both admitted axis intervals, so edge contact is allowed and corner pinches remain a separate lattice check. Endpoint addition uses ordinary binary64 arithmetic; constant work borrows both records without mutation or retained state. */
const overlaps: (left: IAutoMovieWallOpening, right: IAutoMovieWallOpening) => boolean = (
  left: IAutoMovieWallOpening,
  right: IAutoMovieWallOpening,
): boolean =>
  left.x < right.x + right.width &&
  left.x + left.width > right.x &&
  left.y < right.y + right.height &&
  left.y + left.height > right.y;
