import {
  IAutoMovieMesh,
  type IAutoMovieMeshTopology,
} from "@automovie/interface";

import { AutoMovieEngineMeshWeldGrid } from "../../constants/AutoMovieEngineMeshWeldGrid";
import { createMeshEdgeKey } from "../../math/internal/createMeshEdgeKey";
import { decomposeFiniteBinary64 } from "../../math/internal/decomposeFiniteBinary64";
import { weldMeshCorners } from "./weldMeshCorners";

/*
 * Measure a mesh's triangle topology and signed volume from its actual buffers
 * instead of assuming them.
 *
 * Without physical source correspondence, vertices weld by position on the
 * `AutoMovieEngineMeshWeldGrid` lattice, so face-local corners can still form one shell. A
 * mesh that declares physical sources instead keeps their incidence across
 * contact: two different sources stay distinct even where they touch. A
 * triangle whose corners collapse onto fewer than three grid cells is counted
 * degenerate, by ordinal, and contributes no edges in either mode. A closed
 * solid reports `watertight`; an assembly whose members share faces, or a
 * surface meant to stay open, reports its boundary and non-manifold edge counts
 * rather than passing. Non-finite components are counted across positions,
 * normals, UVs, colours and relief weights. Coordinates are metres and the
 * volume, by the divergence theorem, is cubic metres, positive for an
 * outward-wound closed shell.
 *
 * This measures; it does not judge. `validateMeshTopology` is the verdict on
 * the same surface, adding winding consistency and an `expectClosed`
 * declaration, and `validateModel` runs it on every mesh a model carries. A
 * malformed index buffer and invalid physical correspondence throw their own
 * named refusals. The mesh is only read.
 * Parameter mesh: Mesh to measure.
 * Returns: Counts, degenerate ordinals, closure and volume.
 */
export const inspectMeshTopology: (
  mesh: IAutoMovieMesh,
) => IAutoMovieMeshTopology = (
  mesh: IAutoMovieMesh,
): IAutoMovieMeshTopology => {
  const p: number[] = mesh.positions;
  let needsWeldCheck: boolean = false;
  for (const coordinate of p) {
    if (!Number.isFinite(coordinate))
      throw new Error("mesh topology positions must be finite");
    if (!Number.isFinite(coordinate * AutoMovieEngineMeshWeldGrid))
      needsWeldCheck = true;
  }
  const {
    indices,
    corners,
    degenerate: degenerateTriangles,
    identities,
  }: weldMeshCorners.IResult = weldMeshCorners(mesh, "mesh topology");
  if (
    needsWeldCheck &&
    indices.some((index: number): boolean => {
      const at: number = index * 3;
      return (
        !Number.isFinite(p[at]! * AutoMovieEngineMeshWeldGrid) ||
        !Number.isFinite(p[at + 1]! * AutoMovieEngineMeshWeldGrid) ||
        !Number.isFinite(p[at + 2]! * AutoMovieEngineMeshWeldGrid)
      );
    })
  )
    throw new Error("mesh topology uses an unrepresentable weld cell");
  const edgeKey: (from: number, to: number) => number | string =
    createMeshEdgeKey(identities);
  const edges: Map<number | string, number> = new Map();
  for (let index: number = 0; index < indices.length; index += 3) {
    if (corners[index]! < 0) continue;
    for (let edge: number = 0; edge < 3; ++edge) {
      const from: number = corners[index + edge]!;
      const to: number = corners[index + ((edge + 1) % 3)]!;
      const name: number | string = edgeKey(
        Math.min(from, to),
        Math.max(from, to),
      );
      edges.set(name, (edges.get(name) ?? 0) + 1);
    }
  }
  let boundaryEdges: number = 0;
  let nonManifoldEdges: number = 0;
  for (const count of edges.values())
    if (count === 1) boundaryEdges += 1;
    else if (count > 2) nonManifoldEdges += 1;
  let sixVolume: number = 0;
  for (let index: number = 0; index < indices.length; index += 3) {
    const a: number = indices[index]! * 3;
    const b: number = indices[index + 1]! * 3;
    const c: number = indices[index + 2]! * 3;
    sixVolume +=
      p[a]! * (p[b + 1]! * p[c + 2]! - p[b + 2]! * p[c + 1]!) +
      p[a + 1]! * (p[b + 2]! * p[c]! - p[b]! * p[c + 2]!) +
      p[a + 2]! * (p[b]! * p[c + 1]! - p[b + 1]! * p[c]!);
  }
  const volume: number = Number.isFinite(sixVolume)
    ? sixVolume / 6
    : exactSignedVolume(p, indices);
  if (!Number.isFinite(volume))
    throw new Error("mesh topology signed volume is outside finite range");
  return {
    triangles: indices.length / 3,
    degenerate: degenerateTriangles.length,
    degenerateTriangles,
    boundaryEdges,
    nonManifoldEdges,
    watertight: edges.size > 0 && boundaryEdges === 0 && nonManifoldEdges === 0,
    volume,
  };
};

/* Sum the actual origin tetrahedra when the direct intermediate overflows. */
function exactSignedVolume(
  positions: readonly number[],
  indices: readonly number[],
): number {
  let sum: bigint = 0n;
  for (let index: number = 0; index < indices.length; index += 3) {
    const a: number = 3 * indices[index]!,
      b: number = 3 * indices[index + 1]!,
      c: number = 3 * indices[index + 2]!;
    const coordinates = [
      positions[a]!,
      positions[a + 1]!,
      positions[a + 2]!,
      positions[b]!,
      positions[b + 1]!,
      positions[b + 2]!,
      positions[c]!,
      positions[c + 1]!,
      positions[c + 2]!,
    ].map(decomposeFiniteBinary64);
    for (const [i, j, k, sign] of DETERMINANT_PRODUCTS) {
      const u = coordinates[i]!,
        v = coordinates[j]!,
        w = coordinates[k]!;
      const product: bigint = u.significand * v.significand * w.significand;
      if (product !== 0n)
        sum +=
          sign *
          (product <<
            BigInt(u.exponent + v.exponent + w.exponent - PRODUCT_GRID));
    }
  }
  if (sum === 0n) return 0;
  const magnitude: bigint = sum < 0n ? -sum : sum;
  const shift: number = Math.max(
    -1074 - PRODUCT_GRID,
    (magnitude / 6n).toString(2).length - 53,
  );
  const denominator: bigint = 6n << BigInt(shift);
  let leading: bigint = magnitude / denominator;
  const twiceRemainder: bigint = 2n * (magnitude % denominator);
  if (
    twiceRemainder > denominator ||
    (twiceRemainder === denominator && leading % 2n !== 0n)
  )
    leading++;
  return (sum < 0n ? -1 : 1) * Number(leading) * 2 ** (PRODUCT_GRID + shift);
}

const PRODUCT_GRID: number = -3 * 1074;
const DETERMINANT_PRODUCTS: readonly (readonly [
  number,
  number,
  number,
  bigint,
])[] = [
  [0, 4, 8, 1n],
  [1, 5, 6, 1n],
  [2, 3, 7, 1n],
  [0, 5, 7, -1n],
  [1, 3, 8, -1n],
  [2, 4, 6, -1n],
];
