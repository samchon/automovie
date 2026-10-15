import { IAutoMovieSubdivisionStencil } from "./IAutoMovieSubdivisionStencil";

/**
 * Build the Catmull-Clark limit stencil of every vertex of a quad cage.
 *
 * An interior vertex of valence `n` goes to `(n^2 P + 4 sum E + sum D) / (n (n + 5))`,
 * its edge neighbours `E` and the opposite corners `D` of its quads
 * (Halstead, Kass and DeRose 1993, SIGGRAPH, "Efficient, fair interpolation
 * using Catmull-Clark surfaces"); a boundary vertex, whose boundary is an
 * infinitely sharp crease, goes to `(A + 4 P + B) / 6` along its two boundary
 * neighbours, the cubic B-spline limit `subdivideAutoMovieSurface` gives
 * boundaries.
 *
 * @param faces Quads as four vertex indices, a manifold with consistent winding; only read.
 * @param count Number of vertices.
 * @returns The stencils.
 * @throws Error when a face is not a quad, an index is out of range, a vertex belongs to no face, or a vertex has other than zero or two boundary edges.
 *
 * @evidence contracts/common.md#principled-implementation The published limit-point masks of Catmull-Clark subdivision for interior vertices and for crease boundaries.
 * @evidence contracts/common.md#clear-and-simple-design Topology only: one pass gathers neighbours, a second writes compressed rows, and solving is separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A cage with non-quads or non-manifold boundaries is refused instead of being given an approximate mask.
 * @evidence contracts/common.md#meaningful-documentation States both masks, their sources and every refusal.
 * @evidence contracts/performance.md#efficient-algorithms O(F) for F quads: four directed edges per face into a map and one row per vertex.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Called once per cage topology; the result is the reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; the neighbour sets and edge map are released on return and the rows, O(F), are transferred.
 */
export const stencilAutoMovieSubdivisionLimit: (
  faces: ReadonlyArray<readonly number[]>,
  count: number,
) => IAutoMovieSubdivisionStencil = (
  faces: ReadonlyArray<readonly number[]>,
  count: number,
): IAutoMovieSubdivisionStencil => {
  // edge neighbours and quad diagonals of each vertex, and its boundary neighbours
  const edges: Array<Set<number>> = Array.from({ length: count }, (): Set<number> => new Set());
  const diagonals: number[][] = Array.from({ length: count }, (): number[] => []);
  const valence: number[] = new Array<number>(count).fill(0);
  const directed: Map<string, number> = new Map();
  faces.forEach((face: readonly number[], f: number): void => {
    if (face.length !== 4) throw new Error(`fit face ${f} is not a quad`);
    for (let k: number = 0; k < 4; ++k) {
      const a: number = face[k]!;
      if (!Number.isInteger(a) || a < 0 || a >= count) throw new Error(`fit face ${f} names vertex ${a} out of range`);
      const b: number = face[(k + 1) % 4]!;
      const d: number = face[(k + 2) % 4]!;
      edges[a]!.add(b);
      edges[b]!.add(a);
      diagonals[a]!.push(d);
      ++valence[a]!;
      directed.set(`${a},${b}`, (directed.get(`${a},${b}`) ?? 0) + 1);
    }
  });
  const boundary: number[][] = Array.from({ length: count }, (): number[] => []);
  for (const key of directed.keys()) {
    const [a, b] = key.split(",").map(Number) as [number, number];
    if (!directed.has(`${b},${a}`)) {
      boundary[a]!.push(b);
      boundary[b]!.push(a);
    }
  }
  const indices: number[] = [];
  const weights: number[] = [];
  const offsets: Int32Array = new Int32Array(count + 1);
  for (let i: number = 0; i < count; ++i) {
    if (valence[i] === 0) throw new Error(`fit vertex ${i} belongs to no face`);
    const b: number[] = boundary[i]!;
    if (b.length === 2) {
      indices.push(b[0]!, i, b[1]!);
      weights.push(1 / 6, 4 / 6, 1 / 6);
    } else if (b.length === 0) {
      const n: number = valence[i]!;
      const scale: number = 1 / (n * (n + 5));
      indices.push(i);
      weights.push(n * n * scale);
      for (const e of edges[i]!) {
        indices.push(e);
        weights.push(4 * scale);
      }
      for (const d of diagonals[i]!) {
        indices.push(d);
        weights.push(scale);
      }
    } else throw new Error(`fit vertex ${i} has ${b.length} boundary edges`);
    offsets[i + 1] = indices.length;
  }
  return { count, offsets, indices: Int32Array.from(indices), weights: Float64Array.from(weights) };
};
