import type { IAutoMovieCurve64 as C } from "@automovie/engine/geometry/curve";

/**
 * Subdivide private interior edges whose fixed endpoints share one square side.
 * Such a chord has zero transverse UV extent under square Dirichlet data and can
 * collapse an incident ear even for a valid PL disk. Its source-PL midpoint is a
 * new free map vertex, and both incident triangles retain coherent orientation.
 * Original coordinates, boundary observations and physical identities are copied;
 * paired cut occurrences receive equal midpoint keys without ordinal welding.
 * This removes the specific fixed chord obstruction, not all harmonic degeneracy.
 * The consumer must still check every actual signed UV area before fitting.
 *
 * @evidence contracts/common.md#principled-implementation Interior incidence and shared fixed-side membership select only forced-collinear chords. Two incident affine triangles are each split at the same edge midpoint; their union and orientation are preserved in real arithmetic.
 * @evidence contracts/common.md#clear-and-simple-design One private refinement separates PL observation incidence from subsequent harmonic mapping and coefficient generation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coordinate weld, UV clamp, reversed face, guessed source normal or source face publication repairs a failed map. All resulting UV faces still require independent admission.
 * @evidence contracts/common.md#meaningful-documentation States the forced-chord obstruction, private midpoint construction, coherent two-sided split and remaining map obligation.
 * @evidence contracts/performance.md#efficient-algorithms Edge and side registries and constant-size per-triangle subdivision cost O(V+F+E) work and storage for E selected chords. Each chord adds one private vertex and two triangles, and each original triangle has at most three selected edges.
 * @evidence contracts/performance.md#reuse-equivalent-work One incidence registry selects all original chords and physical endpoint keys determine the same midpoint identity on duplicated cut occurrences.
 * @evidence contracts/performance.md#bound-retention-and-release-resources All registries are local; only copied private observations and a scalar subdivision count escape, and original input arrays remain immutable.
 */
export function refineRecoveryChartBoundaryChords(input: {
  verticesMm: readonly C.Vector[];
  triangles: readonly (readonly [number, number, number])[];
  vertexKeys: readonly string[];
  sides: readonly (readonly number[])[];
}): {
  verticesMm: C.Vector[];
  triangles: [number, number, number][];
  vertexKeys: string[];
  subdividedChords: number;
} {
  const verticesMm: C.Vector[] = input.verticesMm.map(
      (point: C.Vector): C.Vector => [...point],
    ),
    vertexKeys: string[] = [...input.vertexKeys];
  let triangles: [number, number, number][] = input.triangles.map(
    (triangle: readonly [number, number, number]): [number, number, number] => [
      ...triangle,
    ],
  );
  const key: (a: number, b: number) => string = (
    a: number,
    b: number,
  ): string => (a < b ? `${a}:${b}` : `${b}:${a}`);
  const sides: Set<number>[] = input.sides.map(
      (side: readonly number[]): Set<number> => new Set(side),
    ),
    boundary: Set<string> = new Set();
  for (const side of input.sides)
    for (let i: number = 1; i < side.length; i++)
      boundary.add(key(side[i - 1]!, side[i]!));
  const edges: Map<string, { a: number; b: number; count: number }> = new Map();
  for (const triangle of triangles)
    for (let i: number = 0; i < 3; i++) {
      const a: number = triangle[i]!,
        b: number = triangle[(i + 1) % 3]!,
        id: string = key(a, b),
        old: { a: number; b: number; count: number } | undefined =
          edges.get(id);
      if (old) old.count++;
      else edges.set(id, { a, b, count: 1 });
    }
  const midpoints: Map<string, number> = new Map();
  for (const [id, edge] of edges)
    if (
      !boundary.has(id) &&
      sides.some(
        (side: Set<number>): boolean => side.has(edge.a) && side.has(edge.b),
      )
    ) {
      if (edge.count !== 2)
        throw new Error(
          "A private fixed-side interior chord must have exactly two coherent incidents",
        );
      const first: number =
          vertexKeys[edge.a]! < vertexKeys[edge.b]! ? edge.a : edge.b,
        second: number = first === edge.a ? edge.b : edge.a;
      const a: C.Vector = verticesMm[first]!,
        b: C.Vector = verticesMm[second]!,
        point: C.Vector = [
          a[0] + (b[0] - a[0]) / 2,
          a[1] + (b[1] - a[1]) / 2,
          a[2] + (b[2] - a[2]) / 2,
        ];
      if (
        !point.every(Number.isFinite) ||
        point.every((value: number, k: number): boolean => value === a[k]) ||
        point.every((value: number, k: number): boolean => value === b[k])
      )
        throw new Error(
          "A private chord midpoint is not representable distinctly",
        );
      const midpoint: number = verticesMm.length;
      verticesMm.push(point);
      vertexKeys.push(
        `private-chord-midpoint:${JSON.stringify([vertexKeys[first], vertexKeys[second]])}`,
      );
      midpoints.set(id, midpoint);
    }
  const output: [number, number, number][] = [];
  for (const triangle of triangles) {
    let children: [number, number, number][] = [triangle];
    for (let i: number = 0; i < 3; i++) {
      const id: string = key(triangle[i]!, triangle[(i + 1) % 3]!),
        midpoint: number | undefined = midpoints.get(id);
      if (midpoint === undefined) continue;
      const next: [number, number, number][] = [];
      for (const child of children) {
        const at: number = child.findIndex(
          (vertex: number, k: number): boolean =>
            key(vertex, child[(k + 1) % 3]!) === id,
        );
        if (at < 0) next.push(child);
        else {
          const x: number = child[at]!,
            y: number = child[(at + 1) % 3]!,
            z: number = child[(at + 2) % 3]!;
          next.push([x, midpoint, z], [midpoint, y, z]);
        }
      }
      children = next;
    }
    output.push(...children);
  }
  triangles = output;
  return {
    verticesMm,
    triangles,
    vertexKeys,
    subdividedChords: midpoints.size,
  };
}
