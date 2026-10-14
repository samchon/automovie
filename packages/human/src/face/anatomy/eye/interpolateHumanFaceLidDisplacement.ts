import type { IAutoMovieVector3 } from "@automovie/interface";

import { solvePortraitSkinSystem } from "../skin/solvePortraitSkinSystem";
import type { IHumanFaceLidDisplacementInput } from "./structures/IHumanFaceLidDisplacementInput";

/**
 * Extend exact cage displacements over the complete native lid annulus.
 *
 * Each unique edge of the canonical-source-sample quotient graph has weight
 * one. This authored graph interpolation reuses native adjacency across shape
 * states without cotangent sign rules, distance denominators or an influence
 * radius. It minimizes one half the sum of squared displacement differences
 * across graph edges, subject to the supplied exact Dirichlet pins. The
 * resulting piecewise-linear native displacement field interpolates pins; it
 * does not guarantee injectivity, smooth normals, optical clearance or tissue
 * physiology. Those conditions remain the seating consumer's obligations.
 *
 * Every boundary sample must be pinned, and every free component must reach a
 * pin. Positive symmetric edge weights then make the reduced Laplacian SPD:
 * its quadratic energy can vanish only for the zero free displacement. The
 * existing solver checks its true numerical residual and refuses breakdown or
 * non-convergence. Its millimetre residual threshold is numerical, not an
 * anatomical clearance. This boundary converts metre displacements to the
 * solver's millimetres and converts free solutions back once; exact pins never
 * undergo that round trip.
 *
 * No caller arrays or vectors are changed, including on failure. The returned
 * map includes all resident aliases of each annulus sample, with identical
 * displacement values. Changes invalidate seated skin, normals, source replay
 * derivatives and the consumer's affected observations.
 *
 * @evidence contracts/common.md#principled-implementation The canonical source-sample quotient's unit-weight graph Laplacian minimizes displacement energy with exact Dirichlet pins and pin-reachable free components.
 * @evidence contracts/common.md#clear-and-simple-design Graph admission owns topology; the existing sparse numerical solver owns conjugate-gradient residual/refusal and unit conversion occurs only for free solutions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The field does not prove injectivity, normals or optical clearance; exact pins never undergo a metre/millimetre round trip.
 * @evidence contracts/common.md#meaningful-documentation The prose states source aliases, SPD premise, numerical residual scope and unchanged caller inputs.
 * @evidence contracts/performance.md#efficient-algorithms Topology/reachability scans and degree sorting precede three solves; up to four-times-free-count iterations each scan sparse adjacency.
 * @evidence contracts/performance.md#reuse-equivalent-work One adjacency/free-index/diagonal population serves all three axes; shared samples reuse identical displacement values across aliases.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned alias displacements own records; graph/solver arrays expire on success/refusal without tasks or global state.
 */
export function interpolateHumanFaceLidDisplacement(
  input: IHumanFaceLidDisplacementInput,
): Map<number, IAutoMovieVector3> {
  const { positions, indices, samples, pins, boundaryVertices }: IHumanFaceLidDisplacementInput = input;
  if (
    positions.length === 0 ||
    positions.length !== 3 * samples.length ||
    !positions.every(Number.isFinite) ||
    !samples.every((sample: number): boolean  => Number.isSafeInteger(sample) && sample >= 0) ||
    indices.length === 0 ||
    indices.length % 3 !== 0
  )
    throw new Error(
      "Lid displacement needs finite source positions and triangles.",
    );
  const sampleAt: (vertex: number) => number = (vertex: number): number => {
    if (!Number.isSafeInteger(vertex) || vertex < 0 || vertex >= samples.length)
      throw new Error("Lid displacement references an absent source vertex.");
    return samples[vertex];
  };
  const neighbours: Map<number, Set<number>> = new Map<number, Set<number>>();
  const edges: Map<string, [number, number, number]> = new Map<string, [number, number, number]>();
  const triangles: Set<string> = new Set<string>();
  for (let at: number = 0; at < indices.length; at += 3) {
    const corners: number[] = indices.slice(at, at + 3).map(sampleAt);
    if (new Set(corners).size !== 3)
      throw new Error(
        "Lid displacement has a collapsed source-sample triangle.",
      );
    const triangle: string = [...corners].sort((a: number, b: number): number  => a - b).join(":");
    if (triangles.has(triangle))
      throw new Error(
        "Lid displacement repeats a native source-sample triangle.",
      );
    triangles.add(triangle);
    for (let corner: number = 0; corner < 3; corner++) {
      const a: number = corners[corner];
      const b: number = corners[(corner + 1) % 3];
      const adjacent: Set<number> = neighbours.get(a) ?? new Set<number>();
      adjacent.add(b);
      neighbours.set(a, adjacent);
      const reverse: Set<number> = neighbours.get(b) ?? new Set<number>();
      reverse.add(a);
      neighbours.set(b, reverse);
      const low: number = Math.min(a, b);
      const high: number = Math.max(a, b);
      const key: string = low + ":" + high;
      const edge: [number, number, number] = edges.get(key) ?? [low, high, 0];
      edge[2]++;
      if (edge[2] > 2)
        throw new Error(
          "Lid displacement has a nonmanifold source-sample edge.",
        );
      edges.set(key, edge);
    }
  }
  const actualBoundary: Set<number> = new Set<number>();
  for (const [a, b, count] of edges.values())
    if (count === 1) {
      actualBoundary.add(a);
      actualBoundary.add(b);
    }
  const declaredBoundary: Set<number> = new Set(boundaryVertices.map(sampleAt));
  if (
    actualBoundary.size === 0 ||
    actualBoundary.size !== declaredBoundary.size ||
    [...actualBoundary].some((sample: number): boolean  => !declaredBoundary.has(sample))
  )
    throw new Error(
      "Lid displacement needs its complete native annulus boundary.",
    );
  const fixed: Map<number, IAutoMovieVector3> = new Map<number, IAutoMovieVector3>();
  for (const [vertex, delta] of pins) {
    const sample: number = sampleAt(vertex);
    if (
      !neighbours.has(sample) ||
      ![delta.x, delta.y, delta.z].every(Number.isFinite)
    )
      throw new Error(
        "Lid displacement pins need annulus samples and finite XYZ.",
      );
    const previous: IAutoMovieVector3 | undefined = fixed.get(sample);
    if (
      previous !== undefined &&
      (previous.x !== delta.x ||
        previous.y !== delta.y ||
        previous.z !== delta.z)
    )
      throw new Error("Lid displacement has contradictory source-alias pins.");
    fixed.set(sample, { x: delta.x, y: delta.y, z: delta.z });
  }
  if ([...actualBoundary].some((sample: number): boolean  => !fixed.has(sample)))
    throw new Error(
      "Lid displacement needs an exact pin on every boundary sample.",
    );
  const reached: Set<number> = new Set(fixed.keys());
  const queue: number[] = [...reached].sort((a: number, b: number): number  => a - b);
  for (let at: number = 0; at < queue.length; at++)
    for (const near of neighbours.get(queue[at])!)
      if (!reached.has(near)) {
        reached.add(near);
        queue.push(near);
      }
  if (reached.size !== neighbours.size)
    throw new Error("Lid displacement has a free component without a pin.");
  const free: number[] = [...neighbours.keys()]
    .filter((sample: number): boolean  => !fixed.has(sample))
    .sort((a: number, b: number): number  => a - b);
  const columns: Map<number, number> = new Map(free.map((sample: number, column: number): [number, number]  => [sample, column]));
  const rows: number[][] = free.map((sample: number): number[]  =>
    [...neighbours.get(sample)!].sort((a: number, b: number): number  => a - b),
  );
  const diagonal: number[] = rows.map((row: number[]): number  => row.length);
  const multiply: (values: number[]) => number[] = (values: number[]): number[] =>
    rows.map((row: number[], i: number): number  =>
      row.reduce((sum: number, near: number): number  => {
        const column: number | undefined = columns.get(near);
        return sum + values[i] - (column === undefined ? 0 : values[column]);
      }, 0),
    );
  const result: Map<number, IAutoMovieVector3> = new Map(fixed);
  for (const sample of free) result.set(sample, { x: 0, y: 0, z: 0 });
  for (const axis of ["x", "y", "z"] as const) {
    const millimetres: Map<number, number> = new Map(
      [...fixed].map(([sample, delta]: [number, IAutoMovieVector3]): [number, number]  => [sample, delta[axis] * 1000]),
    );
    const scale: number = [...millimetres.values()].reduce(
      (maximum: number, value: number): number  => Math.max(maximum, Math.abs(value)),
      1,
    );
    const rhs: number[] = rows.map((row: number[]): number  =>
      row.reduce((sum: number, near: number): number  => sum + (millimetres.get(near) ?? 0), 0),
    );
    if (!Number.isFinite(scale) || !rhs.every(Number.isFinite))
      throw new Error("Lid displacement exceeds finite solver millimetres.");
    const values: number[] = solvePortraitSkinSystem(multiply, diagonal, rhs, scale);
    for (let column: number = 0; column < free.length; column++)
      result.get(free[column])![axis] = values[column] / 1000;
  }
  const expanded: Map<number, IAutoMovieVector3> = new Map<number, IAutoMovieVector3>();
  samples.forEach((sample: number, vertex: number): void  => {
    const delta: IAutoMovieVector3 | undefined = result.get(sample);
    if (delta !== undefined)
      expanded.set(vertex, { x: delta.x, y: delta.y, z: delta.z });
  });
  return expanded;
}
