import {
  IAutoMovieHeightRule,
  IAutoMovieSurface,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieFootprint } from "../space/IAutoMovieFootprint";
import { footprintConvexPieces } from "../space/footprintConvexPieces";
import { surfaceFootprint } from "../space/surfaceFootprint";
import { surfaceHeightAt } from "../space/surfaceHeightAt";
import { ITessellation } from "./ITessellation";

/** Plan distance, in metres, within which a point counts as on a clip edge or a lattice cut as on the footprint's edge. */
const CLIP_EPSILON: number = 1e-10;

/**
 * Tessellate exactly the support surface that engine height queries read.
 *
 * The footprint is taken as the convex pieces whose union is the region itself,
 * so an L-shaped plate keeps its notch and a slab with an atrium void is drawn
 * with the void open. Drawing the hull instead would put floor under a camera
 * looking down the atrium while `surfaceContains` said there was none, which is
 * the same disagreement between the drawn ground and the queried ground that
 * this function exists to prevent.
 *
 * Level and planar patches fan each piece. Heightfields split each piece at
 * every lattice coordinate inside its plan bounds, clip each lattice cell
 * against the piece, and evaluate every resulting vertex through
 * {@link surfaceHeightAt}. Every vertex therefore sits exactly on the bilinear
 * rule that feet and placement queries obey; inside a cell the drawn surface is
 * the fan's planar interpolation of those vertices, which departs from the
 * bilinear patch where a cell is twisted.
 *
 * Positions are world metres with Y up, triangles face +Y, and vertices with
 * identical plan coordinates are shared, so their normals are the normalized
 * sum of the incident face normals.
 *
 * @param surface Support surface to draw.
 * @returns A new indexed mesh, or `null` when the footprint encloses no area.
 *
 * @evidence contracts/common.md#principled-implementation Exact convex decomposition of the footprint, Sutherland-Hodgman clipping of each lattice cell against each convex piece, and fan triangulation of each convex result, with heights from the one `surfaceHeightAt` rule and smooth normals from area-weighted face normals at shared plan vertices; the premise that each piece is convex and counter-clockwise in plan comes from `footprintConvexPieces`, and the remaining limitation is that cell interiors are planar facets of the bilinear patch.
 * @evidence contracts/common.md#clear-and-simple-design Region decomposition and heights are the space package's own `footprintConvexPieces` and `surfaceHeightAt`, so this function owns only clipping, triangulation and normals, and the viewer and render measurement both draw through it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The hull is never substituted for the region and no height is computed by a second rule; a footprint with no area returns `null` rather than a placeholder quad.
 * @evidence contracts/common.md#meaningful-documentation States why pieces rather than the hull, how each height rule is drawn, where the drawn surface departs from the bilinear rule, the frame, unit, winding and vertex sharing, and the `null` result.
 * @evidence contracts/performance.md#efficient-algorithms For K convex pieces of at most M corners and a lattice of C columns and R rows, each piece clips only the cells inside its own plan bounds, so clipping costs O(M) per touched cell instead of O(K * C * R * M) over the whole footprint; vertex sharing is one map lookup per emitted corner, and normals are one pass over the triangles and one over the vertices.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of one surface; the viewer and render measurement each tessellate a surface once per scene build.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; the cuts, clipped cells and plan-key map are linear in the touched cells and released on return, and the position, normal and index arrays are transferred to the caller.
 */
export const tessellateSurface = (
  surface: IAutoMovieSurface,
): ITessellation | null => {
  const footprint: IAutoMovieFootprint = surfaceFootprint(surface);
  const pieces: IAutoMovieVector3[][] = footprintConvexPieces(footprint);
  if (pieces.length === 0) return null;
  if (surface.height?.kind !== "heightfield")
    return tessellatePolygons(surface, pieces);

  const rule: Extract<IAutoMovieHeightRule, { kind: "heightfield" }> =
    surface.height;
  const cells: IAutoMovieVector3[][] = [];
  for (const piece of pieces) {
    const xs: number[] = latticeCuts(
      Math.min(...piece.map((point: IAutoMovieVector3): number => point.x)),
      Math.max(...piece.map((point: IAutoMovieVector3): number => point.x)),
      rule.originX,
      rule.spacingX,
      rule.columns,
    );
    const zs: number[] = latticeCuts(
      Math.min(...piece.map((point: IAutoMovieVector3): number => point.z)),
      Math.max(...piece.map((point: IAutoMovieVector3): number => point.z)),
      rule.originZ,
      rule.spacingZ,
      rule.rows,
    );
    for (let x: number = 0; x + 1 < xs.length; ++x)
      for (let z: number = 0; z + 1 < zs.length; ++z) {
        const clipped: IAutoMovieVector3[] = clipConvexPolygon(
          [
            { x: xs[x]!, y: 0, z: zs[z]! },
            { x: xs[x + 1]!, y: 0, z: zs[z]! },
            { x: xs[x + 1]!, y: 0, z: zs[z + 1]! },
            { x: xs[x]!, y: 0, z: zs[z + 1]! },
          ],
          piece,
        );
        if (clipped.length >= 3) cells.push(clipped);
      }
  }
  return tessellatePolygons(surface, cells);
};

/** Ascending cut coordinates: the span's two ends and every lattice line strictly inside it. */
const latticeCuts = (
  min: number,
  max: number,
  origin: number,
  spacing: number,
  count: number,
): number[] => {
  const values: number[] = [min, max];
  for (let index: number = 0; index < count; ++index) {
    const value: number = origin + index * spacing;
    if (value > min + CLIP_EPSILON && value < max - CLIP_EPSILON)
      values.push(value);
  }
  return [...new Set(values)].sort(
    (left: number, right: number): number => left - right,
  );
};

/** Sutherland-Hodgman clip of a plan polygon against a counter-clockwise convex polygon. */
const clipConvexPolygon = (
  subject: IAutoMovieVector3[],
  clip: IAutoMovieVector3[],
): IAutoMovieVector3[] => {
  let output: IAutoMovieVector3[] = subject;
  for (let edge: number = 0; edge < clip.length; ++edge) {
    const from: IAutoMovieVector3 = clip[edge]!;
    const to: IAutoMovieVector3 = clip[(edge + 1) % clip.length]!;
    const input: IAutoMovieVector3[] = output;
    output = [];
    if (input.length === 0) break;
    for (let index: number = 0; index < input.length; ++index) {
      const current: IAutoMovieVector3 = input[index]!;
      const previous: IAutoMovieVector3 =
        input[(index + input.length - 1) % input.length]!;
      const currentDistance: number = edgeDistance(from, to, current);
      const previousDistance: number = edgeDistance(from, to, previous);
      const currentInside: boolean = currentDistance >= -CLIP_EPSILON;
      const previousInside: boolean = previousDistance >= -CLIP_EPSILON;
      if (currentInside !== previousInside) {
        const progress: number =
          previousDistance / (previousDistance - currentDistance);
        output.push({
          x: previous.x + (current.x - previous.x) * progress,
          y: 0,
          z: previous.z + (current.z - previous.z) * progress,
        });
      }
      if (currentInside) output.push(current);
    }
  }
  return output;
};

/** Plan cross product of the edge and the point: positive on the edge's inner side. */
const edgeDistance = (
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
  point: IAutoMovieVector3,
): number =>
  (to.x - from.x) * (point.z - from.z) - (to.z - from.z) * (point.x - from.x);

/** Fan each convex plan polygon, lifting every shared plan vertex once by the surface's height rule. */
const tessellatePolygons = (
  surface: IAutoMovieSurface,
  polygons: IAutoMovieVector3[][],
): ITessellation => {
  const positions: number[] = [];
  const indices: number[] = [];
  const vertexByPlan: Map<string, number> = new Map();
  const vertexOf = (point: IAutoMovieVector3): number => {
    const key: string = `${point.x}/${point.z}`;
    const existing: number | undefined = vertexByPlan.get(key);
    if (existing !== undefined) return existing;
    const index: number = positions.length / 3;
    positions.push(
      point.x,
      surfaceHeightAt(surface, point.x, point.z),
      point.z,
    );
    vertexByPlan.set(key, index);
    return index;
  };
  for (const polygon of polygons) {
    const vertices: number[] = polygon.map(vertexOf);
    for (let index: number = 1; index + 1 < vertices.length; ++index)
      indices.push(vertices[0]!, vertices[index + 1]!, vertices[index]!);
  }
  return { positions, normals: vertexNormals(positions, indices), indices };
};

/** Normalized sum of the area-weighted normals of the triangles around each vertex. */
const vertexNormals = (positions: number[], indices: number[]): number[] => {
  const normals: number[] = new Array<number>(positions.length).fill(0);
  for (let index: number = 0; index < indices.length; index += 3) {
    const a: number = indices[index]! * 3;
    const b: number = indices[index + 1]! * 3;
    const c: number = indices[index + 2]! * 3;
    const abx: number = positions[b]! - positions[a]!;
    const aby: number = positions[b + 1]! - positions[a + 1]!;
    const abz: number = positions[b + 2]! - positions[a + 2]!;
    const acx: number = positions[c]! - positions[a]!;
    const acy: number = positions[c + 1]! - positions[a + 1]!;
    const acz: number = positions[c + 2]! - positions[a + 2]!;
    const nx: number = aby * acz - abz * acy;
    const ny: number = abz * acx - abx * acz;
    const nz: number = abx * acy - aby * acx;
    for (const offset of [a, b, c]) {
      normals[offset] += nx;
      normals[offset + 1] += ny;
      normals[offset + 2] += nz;
    }
  }
  for (let index: number = 0; index < normals.length; index += 3) {
    const length: number = Math.hypot(
      normals[index]!,
      normals[index + 1]!,
      normals[index + 2]!,
    );
    normals[index] /= length;
    normals[index + 1] /= length;
    normals[index + 2] /= length;
  }
  return normals;
};
