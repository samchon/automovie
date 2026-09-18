/**
 * Minimum area-weighted forward travel for two resident triangle surfaces.
 * meshClearance owns projected clipping and affine witnesses; this owner turns
 * them into one convex displacement problem. It retains every witness, including
 * initially clear ones, and caps each vertex by the established conservative
 * face-deficit construction. Coordinates stay in the caller's common frame.
 * This is directional ordering, not closed-volume collision or tissue anatomy.
 */
import type { IAutoMovieMesh } from "@automovie/interface";

import { solveAutoMovieBoundedDisplacement } from "../math/solveAutoMovieBoundedDisplacement";
import { type IAutoMovieMeshClearanceWitness } from "./IAutoMovieMeshClearanceWitness";
import { measureAutoMovieMeshClearance } from "./measureAutoMovieMeshClearance";

/**
 * Return joint vertex travel along one positive local axis, in metres. The
 * objective is half the sum of incident-area mass times squared displacement.
 * Mass lumping assigns one third of each triangle's area to each corner; this
 * approximates a surface integral without inferring elasticity or tissue force.
 * Each vertex is bounded between zero and its largest incident face deficit,
 * so no target advances farther than the conservative triangle correction.
 * Unused and already-clear vertices need no variable. Inputs remain unchanged.
 *
 * Travel is normalized by the largest cap and masses by their positive mean;
 * both are common scalar changes and preserve the minimum. Numerical acceptance
 * permits a row residual of 1e-7 in normalized travel units. This is solver
 * precision, not an added geometric clearance. Incomplete or infeasible solves
 * refuse rather than silently substituting the conservative or relaxed result.
 * Consumers must recheck after shared-skin propagation and Float32 export.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Resolves all resident contact witnesses together while minimizing unnecessary shared-surface motion within conservative upper bounds.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Preserves projected triangle connectivity, original vertex identities and all affine depth conditions during a bounded area-weighted solve.
 */
export function minimizeAutoMovieMeshClearance(
  front: IAutoMovieMesh,
  back: IAutoMovieMesh,
  axis: "x" | "y" | "z",
  clearance = 0,
): { vertex: number; distance: number }[] {
  if (!Number.isFinite(clearance) || clearance < 0)
    throw new Error("Minimum mesh clearance must be finite and nonnegative.");
  const witnesses: IAutoMovieMeshClearanceWitness[] = [];
  const measured = measureAutoMovieMeshClearance(front, back, axis, (witness) =>
    witnesses.push(witness),
  );
  const indices =
    front.indices ??
    Array.from({ length: front.positions.length / 3 }, (_, i) => i);
  const caps = new Map<number, number>();
  for (const { triangle, minimum } of measured) {
    const deficit = clearance - minimum;
    if (deficit <= 0) continue;
    for (const vertex of indices.slice(3 * triangle, 3 * triangle + 3))
      caps.set(vertex, Math.max(caps.get(vertex) ?? 0, deficit));
  }
  if (caps.size === 0) return [];
  const vertices = [...caps.keys()].sort((a, b) => a - b);
  const lookup = new Map(vertices.map((vertex, index) => [vertex, index]));
  const mass = vertices.map(() => 0);
  for (let i = 0; i < indices.length; i += 3) {
    const [a, b, c] = indices
      .slice(i, i + 3)
      .map((id) => front.positions.slice(3 * id, 3 * id + 3));
    const u = b.map((v, j) => v - a[j]),
      v = c.map((value, j) => value - a[j]);
    // One third of physical triangle area is each incident vertex's lumped mass.
    const area =
      Math.hypot(
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0],
      ) / 6;
    for (const vertex of indices.slice(i, i + 3)) {
      const id = lookup.get(vertex);
      if (id !== undefined) mass[id] += area;
    }
  }
  const upper = vertices.map((id) => caps.get(id)!);
  let unit = 0,
    mean = 0;
  for (let i = 0; i < upper.length; i++) {
    unit = Math.max(unit, upper[i]);
    mean += mass[i] / mass.length;
  }
  const constraints = witnesses.map((witness) => {
    const ids: number[] = [],
      weights: number[] = [];
    for (let i = 0; i < witness.vertices.length; i++) {
      const id = lookup.get(witness.vertices[i]);
      if (id !== undefined) {
        ids.push(id);
        weights.push(witness.weights[i]);
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
  });
  const solved = solveAutoMovieBoundedDisplacement({
    mass: mass.map((value) => value / mean),
    upper: upper.map((value) => value / unit),
    constraints,
    tolerance: 1e-7,
    maximumRounds: 40,
  });
  return vertices.map((vertex, i) => ({
    vertex,
    distance: solved.travel[i] * unit,
  }));
}
