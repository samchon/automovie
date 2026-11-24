import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryChartBoundaryChordsRefinementOperation,
} from "@automovie/interface";

/**
 * Subdivide private interior edges whose fixed endpoints share one square side.
 * Such a chord has zero transverse UV extent under square Dirichlet data and
 * can collapse an incident ear even for a valid PL disk. Its source-PL midpoint
 * is a new free map vertex, and both incident triangles retain coherent
 * orientation. Original coordinates, boundary observations and physical
 * identities are copied; paired cut occurrences receive equal midpoint keys
 * without ordinal welding. This removes the specific fixed chord obstruction,
 * not all harmonic degeneracy. The consumer must still check every actual
 * signed UV area before fitting.
 */
export function refineRecoveryChartBoundaryChords(
  input: Parameters<IAutoMovieRecoveryChartBoundaryChordsRefinementOperation.Operation>[0],
): ReturnType<IAutoMovieRecoveryChartBoundaryChordsRefinementOperation.Operation> {
  const verticesMm: Readonly<AutoMovieVector3Tuple>[] = input.verticesMm.map(
      (
        point: Readonly<AutoMovieVector3Tuple>,
      ): Readonly<AutoMovieVector3Tuple> => [...point],
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
      const a: Readonly<AutoMovieVector3Tuple> = verticesMm[first]!,
        b: Readonly<AutoMovieVector3Tuple> = verticesMm[second]!,
        point: Readonly<AutoMovieVector3Tuple> = [
          a[0] + (b[0] - a[0]) / 2,
          a[1] + (b[1] - a[1]) / 2,
          a[2] + (b[2] - a[2]) / 2,
        ];
      if (
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
