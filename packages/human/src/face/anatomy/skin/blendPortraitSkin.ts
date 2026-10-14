/**
 * Shared component-to-skin displacement for the portrait host assembler.
 * Host positions and geodesic distances use millimetres in one local frame.
 * Build connectivity before propagating reach, then solve all overlapping
 * attachment requests together. Exact pins and unreachable skin are Dirichlet
 * boundaries; caller arrays are never mutated. The positive graph interpolant
 * is not an elastic-tissue simulation or an anatomical reconstruction.
 * Changes here propagate into every attached component, refined skin, normals
 * and exported face, so derived face artifacts must be rebuilt together.
 */
import { solvePortraitSkinSystem } from "./solvePortraitSkinSystem";
import type { IPortraitSkinConstraint } from "./structures/IPortraitSkinConstraint";

/**
 * Adapt neighbouring skin to a set of exact component attachments. Distances
 * travel along the host mesh, so an eye cannot influence nearby but disconnected
 * geometry. Overlapping influence regions solve together; part order does not
 * select which displacement wins. Contradictory attachment positions are refused.
 *
 * Fixed attachment vertices retain their requested positions. The surrounding
 * displacement solves a positive-weight graph Laplace system against unchanged
 * skin outside the declared reach, with an independently checked residual.
 * Failure to converge is refused. This interpolates the seam; it does not infer
 * the anatomical correctness of the component's requested shape.
 * Graph distances are edge-path distances, not exact continuous geodesics.
 * The inverse-distance weight uses a conventional 1e-6 mm floor for coincident
 * or very short edges. The function assumes finite XYZ and resident triangular
 * connectivity from its assembler; it validates attachment requests rather
 * than independently admitting the whole host mesh.
 *
 * @evidence contracts/common.md#principled-implementation Multi-source remaining-reach propagation over original mesh edges selects the free region; a positive inverse-edge-weight Dirichlet Laplacian solves three displacement axes against exact attachment pins and unchanged outside skin. CG checks equation residual, not anatomical correctness or general forward error.
 * @evidence contracts/common.md#clear-and-simple-design Connectivity, joint pin admission, reach and one sparse free-vertex operator remain in this seam owner; solvePortraitSkinSystem owns the shared bounded numerical solve rather than separate per-component corrections.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Conflicting exact targets refuse and callers' arrays remain unchanged. Edge-path reach and the 1e-6 mm weight floor are authored interpolation conventions; source validity and clinical shape are not inferred from convergence.
 * @evidence contracts/common.md#meaningful-documentation The prose gives millimetre frame, shared-input/owned-output semantics, joint solving, disconnected-skin boundary, solver refusal and graph/geometric/anatomical limits.
 * @evidence contracts/performance.md#efficient-algorithms Building connectivity costs O(V+T), reach selects only the active frontier but its linear selection can cost O(V squared), and each of three CG solves performs sparse-row work for at most 4F iterations. Localized frontier reduces unnecessary whole-mesh selection scans but supplies no measured speedup or heap-equivalent bound.
 * @evidence contracts/performance.md#reuse-equivalent-work All attachment requests share one original connectivity/reach field and one free-vertex matrix; its rows and diagonal are reused for XYZ while independent right-hand sides are solved separately. Changed geometry or constraints rebuild the invocation state.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Maps, reach, sparse rows and solver arrays scale with current V/T/constraints/free vertices and live only for the call; fixed targets and final positions are copied, so numerical refusal cannot commit a partial caller mesh and no global resource survives.
 */
export function blendPortraitSkin(
  positions: number[][],
  indices: number[],
  constraints: IPortraitSkinConstraint[],
): number[][] {
  const neighbours: Map<number, number>[] = positions.map(
    (): Map<number, number> => new Map<number, number>(),
  );
  for (let i: number = 0; i < indices.length; i += 3)
    for (let corner: number = 0; corner < 3; corner++) {
      const a: number = indices[i + corner],
        b: number = indices[i + ((corner + 1) % 3)];
      const distance: number = Math.hypot(
        ...positions[a].map(
          (value: number, axis: number): number => value - positions[b][axis],
        ),
      );
      neighbours[a].set(b, distance);
      neighbours[b].set(a, distance);
    }
  const fixed: Map<number, number[]> = new Map<number, number[]>();
  const reach: number[] = new Array<number>(positions.length).fill(0);
  for (const constraint of constraints) {
    if (
      !Number.isInteger(constraint.vertex) ||
      constraint.vertex < 0 ||
      constraint.vertex >= positions.length ||
      constraint.target.length !== 3 ||
      !constraint.target.every(Number.isFinite) ||
      !Number.isFinite(constraint.reach) ||
      constraint.reach < 0
    )
      throw new Error(
        "A skin attachment needs a resident vertex, finite XYZ and nonnegative reach.",
      );
    const previous: number[] | undefined = fixed.get(constraint.vertex);
    if (
      previous !== undefined &&
      previous.some(
        (value: number, axis: number): boolean =>
          value !== constraint.target[axis],
      )
    )
      throw new Error(
        "Two components request different positions for one skin attachment.",
      );
    fixed.set(constraint.vertex, [...constraint.target]);
    reach[constraint.vertex] = Math.max(
      reach[constraint.vertex],
      constraint.reach,
    );
  }
  // Max-remaining-distance propagation is multi-source Dijkstra. Scan only
  // the active frontier rather than every resident vertex at each step. Ties
  // still select the lowest vertex ID, independent of constraint insertion.
  const visited: Set<number> = new Set<number>();
  const frontier: Set<number> = new Set(
    reach.flatMap((remaining: number, id: number): number[] =>
      remaining > 0 ? [id] : [],
    ),
  );
  for (;;) {
    let next: number = -1,
      remaining: number = 0;
    for (const i of frontier)
      if (reach[i] > remaining || (reach[i] === remaining && i < next)) {
        next = i;
        remaining = reach[i];
      }
    if (next === -1) break;
    frontier.delete(next);
    visited.add(next);
    for (const [near, distance] of neighbours[next]) {
      const proposed: number = remaining - distance;
      if (!visited.has(near) && proposed > reach[near]) {
        reach[near] = proposed;
        frontier.add(near);
      }
    }
  }
  const delta: number[][] = positions.map(
    (point: number[], id: number): number[] => {
      const target: number[] | undefined = fixed.get(id);
      return target === undefined
        ? [0, 0, 0]
        : target.map(
            (value: number, axis: number): number => value - point[axis],
          );
    },
  );
  const free: number[] = [...visited]
    .filter((id: number): boolean => !fixed.has(id))
    .sort((a: number, b: number): number => a - b);
  // Eliminate the boundary unknowns. Each reachable free component has a path
  // to a fixed pin, making its positive-weight Dirichlet matrix positive
  // definite. A self edge contributes w*(u-u)=0, including at a repeated corner.
  const columns: Map<number, number> = new Map(
    free.map((id: number, column: number): [number, number] => [id, column]),
  );
  const rows: { near: number; column: number | undefined; weight: number }[][] =
    free.map(
      (
        id: number,
      ): { near: number; column: number | undefined; weight: number }[] =>
        [...neighbours[id]]
          .filter(([near]: [number, number]): boolean => near !== id)
          .map(
            ([near, distance]: [number, number]): {
              near: number;
              column: number | undefined;
              weight: number;
            } => ({
              near,
              column: columns.get(near),
              weight: 1 / Math.max(distance, 1e-6),
            }),
          ),
    );
  const diagonal: number[] = rows.map(
    (
      row: { near: number; column: number | undefined; weight: number }[],
    ): number =>
      row.reduce(
        (
          sum: number,
          edge: { near: number; column: number | undefined; weight: number },
        ): number => sum + edge.weight,
        0,
      ),
  );
  const multiply: (values: number[]) => number[] = (
    values: number[],
  ): number[] =>
    rows.map(
      (
        row: { near: number; column: number | undefined; weight: number }[],
        i: number,
      ): number =>
        row.reduce(
          (
            sum: number,
            edge: { near: number; column: number | undefined; weight: number },
          ): number =>
            sum +
            edge.weight *
              (values[i] -
                (edge.column === undefined ? 0 : values[edge.column])),
          0,
        ),
    );
  for (let axis: number = 0; axis < 3; axis++) {
    const rhs: number[] = rows.map(
      (
        row: { near: number; column: number | undefined; weight: number }[],
      ): number =>
        row.reduce(
          (
            sum: number,
            edge: { near: number; column: number | undefined; weight: number },
          ): number =>
            sum +
            (edge.column === undefined
              ? edge.weight * delta[edge.near][axis]
              : 0),
          0,
        ),
    );
    const scale: number = delta.reduce(
      (maximum: number, displacement: number[]): number =>
        Math.max(maximum, Math.abs(displacement[axis])),
      1,
    );
    const values: number[] = solvePortraitSkinSystem(
      multiply,
      diagonal,
      rhs,
      scale,
    );
    free.forEach(
      (id: number, column: number): number =>
        (delta[id][axis] = values[column]),
    );
  }
  return positions.map(
    (point: number[], id: number): number[] =>
      fixed.get(id) ??
      point.map(
        (value: number, axis: number): number => value + delta[id][axis],
      ),
  );
}
