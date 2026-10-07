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
 * @evidence contracts/common.md#principled-implementation A uniform positive symmetric source-adjacency Laplacian minimizes discrete displacement energy; explicit component-to-pin reachability proves its Dirichlet reduction positive definite, and solvePortraitSkinSystem verifies the true residual. This interpolation makes no injectivity or physiological claim.
 * @evidence contracts/common.md#clear-and-simple-design Admit topology and pins, establish the SPD condition, solve each Cartesian axis using one existing solver, then expand canonical samples to source aliases.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contradictory alias pins, incomplete boundary constraints and unanchored components refuse; neither vertex coordinates nor part identities select exceptions.
 * @evidence contracts/common.md#meaningful-documentation States the graph energy, unit conversion, exact-pin preservation, failure atomicity and the geometric conditions not proved by interpolation.
 * @evidence contracts/modeling.md#spatial-conventions Metre head-local input and output; only free-axis solver quantities convert to millimetres and back, without a coordinate-frame change.
 * @evidence contracts/modeling.md#shared-boundaries The seating owner supplies every boundary displacement; canonical source aliases retain that one exact definition, including unchanged boundaries.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Interpolates existing skin data and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Consumes resolved displacement constraints, not shape channels.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Returns displacement vectors for existing source vertices and creates no primitives.
 * @evidenceExclude contracts/modeling.md#rendered-observation The seating consumer owns assembled-skin observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source A discrete interpolation rule supplies no anatomical value or tissue constitutive law.
 * @evidenceExclude contracts/anatomy.md#permitted-range Numerical solvability is not physiological admission.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This internal helper adds no public human authoring input.
 */
export function interpolateHumanFaceLidDisplacement(
  input: IHumanFaceLidDisplacementInput,
): Map<number, IAutoMovieVector3> {
  const { positions, indices, samples, pins, boundaryVertices } = input;
  if (
    positions.length === 0 ||
    positions.length !== 3 * samples.length ||
    !positions.every(Number.isFinite) ||
    !samples.every((sample) => Number.isSafeInteger(sample) && sample >= 0) ||
    indices.length === 0 ||
    indices.length % 3 !== 0
  )
    throw new Error("Lid displacement needs finite source positions and triangles.");
  const sampleAt = (vertex: number): number => {
    if (!Number.isSafeInteger(vertex) || vertex < 0 || vertex >= samples.length)
      throw new Error("Lid displacement references an absent source vertex.");
    return samples[vertex];
  };
  const neighbours = new Map<number, Set<number>>();
  const edges = new Map<string, [number, number, number]>();
  const triangles = new Set<string>();
  for (let at = 0; at < indices.length; at += 3) {
    const corners = indices.slice(at, at + 3).map(sampleAt);
    if (new Set(corners).size !== 3)
      throw new Error("Lid displacement has a collapsed source-sample triangle.");
    const triangle = [...corners].sort((a, b) => a - b).join(":");
    if (triangles.has(triangle))
      throw new Error("Lid displacement repeats a native source-sample triangle.");
    triangles.add(triangle);
    for (let corner = 0; corner < 3; corner++) {
      const a = corners[corner];
      const b = corners[(corner + 1) % 3];
      const adjacent = neighbours.get(a) ?? new Set<number>();
      adjacent.add(b);
      neighbours.set(a, adjacent);
      const reverse = neighbours.get(b) ?? new Set<number>();
      reverse.add(a);
      neighbours.set(b, reverse);
      const low = Math.min(a, b);
      const high = Math.max(a, b);
      const key = low + ":" + high;
      const edge: [number, number, number] = edges.get(key) ?? [low, high, 0];
      edge[2]++;
      if (edge[2] > 2)
        throw new Error("Lid displacement has a nonmanifold source-sample edge.");
      edges.set(key, edge);
    }
  }
  const actualBoundary = new Set<number>();
  for (const [a, b, count] of edges.values())
    if (count === 1) {
      actualBoundary.add(a);
      actualBoundary.add(b);
    }
  const declaredBoundary = new Set(boundaryVertices.map(sampleAt));
  if (
    actualBoundary.size === 0 ||
    actualBoundary.size !== declaredBoundary.size ||
    [...actualBoundary].some((sample) => !declaredBoundary.has(sample))
  )
    throw new Error("Lid displacement needs its complete native annulus boundary.");
  const fixed = new Map<number, IAutoMovieVector3>();
  for (const [vertex, delta] of pins) {
    const sample = sampleAt(vertex);
    if (
      !neighbours.has(sample) ||
      ![delta.x, delta.y, delta.z].every(Number.isFinite)
    )
      throw new Error("Lid displacement pins need annulus samples and finite XYZ.");
    const previous = fixed.get(sample);
    if (
      previous !== undefined &&
      (previous.x !== delta.x || previous.y !== delta.y || previous.z !== delta.z)
    )
      throw new Error("Lid displacement has contradictory source-alias pins.");
    fixed.set(sample, { x: delta.x, y: delta.y, z: delta.z });
  }
  if ([...actualBoundary].some((sample) => !fixed.has(sample)))
    throw new Error("Lid displacement needs an exact pin on every boundary sample.");
  const reached = new Set(fixed.keys());
  const queue = [...reached].sort((a, b) => a - b);
  for (let at = 0; at < queue.length; at++)
    for (const near of neighbours.get(queue[at])!)
      if (!reached.has(near)) {
        reached.add(near);
        queue.push(near);
      }
  if (reached.size !== neighbours.size)
    throw new Error("Lid displacement has a free component without a pin.");
  const free = [...neighbours.keys()]
    .filter((sample) => !fixed.has(sample))
    .sort((a, b) => a - b);
  const columns = new Map(free.map((sample, column) => [sample, column]));
  const rows = free.map((sample) =>
    [...neighbours.get(sample)!].sort((a, b) => a - b),
  );
  const diagonal = rows.map((row) => row.length);
  const multiply = (values: number[]): number[] =>
    rows.map((row, i) =>
      row.reduce((sum, near) => {
        const column = columns.get(near);
        return sum + values[i] - (column === undefined ? 0 : values[column]);
      }, 0),
    );
  const result = new Map(fixed);
  for (const sample of free) result.set(sample, { x: 0, y: 0, z: 0 });
  for (const axis of ["x", "y", "z"] as const) {
    const millimetres = new Map(
      [...fixed].map(([sample, delta]) => [sample, delta[axis] * 1000]),
    );
    const scale = [...millimetres.values()].reduce(
      (maximum, value) => Math.max(maximum, Math.abs(value)),
      1,
    );
    const rhs = rows.map((row) =>
      row.reduce((sum, near) => sum + (millimetres.get(near) ?? 0), 0),
    );
    if (!Number.isFinite(scale) || !rhs.every(Number.isFinite))
      throw new Error("Lid displacement exceeds finite solver millimetres.");
    const values = solvePortraitSkinSystem(multiply, diagonal, rhs, scale);
    for (let column = 0; column < free.length; column++)
      result.get(free[column])![axis] = values[column] / 1000;
  }
  const expanded = new Map<number, IAutoMovieVector3>();
  samples.forEach((sample, vertex) => {
    const delta = result.get(sample);
    if (delta !== undefined)
      expanded.set(vertex, { x: delta.x, y: delta.y, z: delta.z });
  });
  return expanded;
}
