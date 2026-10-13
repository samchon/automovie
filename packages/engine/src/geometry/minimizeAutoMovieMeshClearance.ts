import type { IAutoMovieMesh } from "@automovie/interface";

import { IAutoMovieQuadraticRow } from "../math/IAutoMovieQuadraticRow";
import { solveAutoMovieBoundedDisplacement } from "../math/solveAutoMovieBoundedDisplacement";
import { type IAutoMovieMeshClearanceWitness } from "./IAutoMovieMeshClearanceWitness";
import { measureAutoMovieMeshClearance } from "./measureAutoMovieMeshClearance";

/**
 * Find the smallest joint forward travel of the front mesh's vertices along
 * one positive axis that restores a requested clearance over a back mesh.
 *
 * `measureAutoMovieMeshClearance` supplies every affine overlap witness,
 * already-clear ones included; each becomes the linear constraint that the
 * barycentric blend of its front vertices' travel closes its deficit. The
 * objective is half the sum of lumped mass times squared travel, each vertex's
 * mass a third of every incident triangle's area, an approximation of the
 * surface integral that infers no elasticity or tissue force. Each vertex
 * travels between zero and its largest incident face deficit, so no point
 * moves farther than the conservative per-triangle correction. Only vertices of
 * triangles with a positive deficit get a variable; the result lists them in
 * ascending vertex order with their travel in metres, and is empty when
 * nothing needs to move. Both meshes share the caller's frame and are only
 * read; this is directional ordering, not closed-volume collision or anatomy.
 *
 * Travel is normalized by the largest cap and masses by their mean, scalar
 * changes that keep the minimizer. The solver accepts a row residual of 1e-7
 * in normalized travel units within 40 rounds; that is solver precision, not
 * added clearance. A negative or non-finite clearance throws, as do the
 * measurement's refusals and an incomplete or infeasible solve, rather than
 * returning the conservative or a relaxed result. Callers must re-check after
 * propagating the travel through a shared skin and after Float32 export.
 *
 * @param front Mesh whose vertices move.
 * @param back Mesh it must clear.
 * @param axis Depth axis; travel is along its positive direction.
 * @param clearance Required nonnegative depth gap in metres.
 * @returns Travel per moved front vertex.
 *
 * @evidence contracts/common.md#principled-implementation A convex quadratic program: a lumped-mass quadratic objective with box bounds and one linear row per witness, which is exact because depth is affine on each overlap polygon so its vertex witnesses bound the whole polygon, solved by the shared bounded-displacement active-set owner.
 * @evidence contracts/common.md#clear-and-simple-design Measurement belongs to `measureAutoMovieMeshClearance` and the solve to `solveAutoMovieBoundedDisplacement`; this function only turns witnesses into rows, caps and masses and scales them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The 1e-7 residual and 40-round budget are solver precision and work bounds, not geometric slack, and a failed solve throws instead of falling back to the conservative per-triangle travel.
 * @evidence contracts/common.md#meaningful-documentation States the constraint source, objective and mass rule, the bounds and their meaning, which vertices get variables, the result's order and unit, the scaling, the solver tolerance, every refusal, and what callers must re-check.
 * @evidence contracts/performance.md#efficient-algorithms The measurement dominates for large meshes; mass lumping is one pass over the front triangles, row construction one pass over the witnesses, and the solve works only on vertices with a positive cap and the witness rows that touch them.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One solve per front and back pair in their current positions; a moved surface needs a new measurement and solve.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Holds every witness, one row per witness and per-variable arrays during the call, bounded by the overlap witness count and capped vertex count, and returns one record per moved vertex.
 * @author Samchon
 */
export function minimizeAutoMovieMeshClearance(
  front: IAutoMovieMesh,
  back: IAutoMovieMesh,
  axis: "x" | "y" | "z",
  clearance: number = 0,
): { vertex: number; distance: number }[] {
  if (!Number.isFinite(clearance) || clearance < 0)
    throw new Error("Minimum mesh clearance must be finite and nonnegative.");
  const witnesses: IAutoMovieMeshClearanceWitness[] = [];
  const measured: { triangle: number; minimum: number }[] =
    measureAutoMovieMeshClearance(
      front,
      back,
      axis,
      (witness: IAutoMovieMeshClearanceWitness): void => {
        witnesses.push(witness);
      },
    );
  // The measurement admitted the index buffer; null means vertex triples.
  const indices: number[] =
    front.indices ??
    Array.from(
      { length: front.positions.length / 3 },
      (_: unknown, i: number): number => i,
    );
  const caps: Map<number, number> = new Map();
  for (const { triangle, minimum } of measured) {
    const deficit: number = clearance - minimum;
    if (deficit <= 0) continue;
    for (const vertex of indices.slice(3 * triangle, 3 * triangle + 3))
      caps.set(vertex, Math.max(caps.get(vertex) ?? 0, deficit));
  }
  if (caps.size === 0) return [];
  const vertices: number[] = [...caps.keys()].sort(
    (a: number, b: number): number => a - b,
  );
  const lookup: Map<number, number> = new Map(
    vertices.map((vertex: number, index: number): [number, number] => [
      vertex,
      index,
    ]),
  );
  const mass: number[] = vertices.map((): number => 0);
  const p: number[] = front.positions;
  for (let i: number = 0; i < indices.length; i += 3) {
    const a: number = 3 * indices[i]!;
    const b: number = 3 * indices[i + 1]!;
    const c: number = 3 * indices[i + 2]!;
    const u: number[] = [p[b]! - p[a]!, p[b + 1]! - p[a + 1]!, p[b + 2]! - p[a + 2]!];
    const v: number[] = [p[c]! - p[a]!, p[c + 1]! - p[a + 1]!, p[c + 2]! - p[a + 2]!];
    // One third of physical triangle area is each incident vertex's lumped mass.
    const area: number =
      Math.hypot(
        u[1]! * v[2]! - u[2]! * v[1]!,
        u[2]! * v[0]! - u[0]! * v[2]!,
        u[0]! * v[1]! - u[1]! * v[0]!,
      ) / 6;
    for (const vertex of indices.slice(i, i + 3)) {
      const id: number | undefined = lookup.get(vertex);
      if (id !== undefined) mass[id] += area;
    }
  }
  const upper: number[] = vertices.map((id: number): number => caps.get(id)!);
  let unit: number = 0;
  let mean: number = 0;
  for (let i: number = 0; i < upper.length; i++) {
    unit = Math.max(unit, upper[i]!);
    mean += mass[i]! / mass.length;
  }
  const constraints: { group: number; row: IAutoMovieQuadraticRow }[] =
    witnesses.map(
      (
        witness: IAutoMovieMeshClearanceWitness,
      ): { group: number; row: IAutoMovieQuadraticRow } => {
        const ids: number[] = [];
        const weights: number[] = [];
        for (let i: number = 0; i < witness.vertices.length; i++) {
          const id: number | undefined = lookup.get(witness.vertices[i]!);
          if (id !== undefined) {
            ids.push(id);
            weights.push(witness.weights[i]!);
          }
        }
        return {
          group: witness.triangle,
          row: {
            indices: ids,
            weights,
            lower: (clearance - witness.gap) / unit,
            upper: null,
          },
        };
      },
    );
  const solved: { travel: number[] } = solveAutoMovieBoundedDisplacement({
    mass: mass.map((value: number): number => value / mean),
    upper: upper.map((value: number): number => value / unit),
    constraints,
    tolerance: 1e-7,
    maximumRounds: 40,
  });
  return vertices.map(
    (vertex: number, i: number): { vertex: number; distance: number } => ({
      vertex,
      distance: solved.travel[i]! * unit,
    }),
  );
}
