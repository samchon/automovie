import { Vector3, measureAutoMovieMeshClearance } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import { advancePoint } from "./advancePoint";
import { portraitDirectionalContactFrame } from "./portraitDirectionalContactFrame";
import { projectMeshOntoFrame } from "./projectMeshOntoFrame";

/**
 * Resolve complete triangle contact in the same frame as point contact. Each
 * offending face supplies its maximum required forward travel to all three
 * corners; a shared corner receives the maximum of its incident requirements.
 * Thus every interpolated point of that face advances at least its deficit.
 * The caller applies these metric targets through its shared skin adapter and
 * recomputes normals. This conservative construction preserves projected
 * topology; it does not decide anatomical thickness or fit quality.
 * Meshes, clearance and targets use engine metres in a common frame. The
 * measurement skips projection-parallel faces. Recheck after skin propagation
 * and Float32 export; this function returns targets without mutating either mesh.
 *
 * @evidence contracts/common.md#principled-implementation Affine depth minima over complete projected overlap polygons supply face deficits; assigning their maximum to incident corners conservatively clears each measured face under unchanged projection.
 * @evidence contracts/common.md#clear-and-simple-design The engine owns projected triangle measurement; this adapter aggregates per-vertex travel and maps it back through the same shared frame.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Complete overlap witnesses replace vertex-only sampling, but parallel faces are omitted and downstream propagation/export must be rechecked rather than certified by these targets.
 * @evidence contracts/common.md#meaningful-documentation Prose states units, incident maximum semantics, no mutation, conservative directional scope and caller-owned propagation checks.
 * @evidence contracts/performance.md#efficient-algorithms Two O(V) projections precede the engine's O(B log-squared B) back-triangle tree and overlapping-pair clipping; deficit aggregation visits three corners per measured face and returns one record per moved vertex.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Current front/back geometry determines each contact measurement; changed positions require new projection and measurement, with no persistent coordinator here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Projected meshes, measurements and the travel map live for this call; only O(moved vertices) target records escape to the caller.
 */
export function portraitDirectionalSurfaceTargets(
  front: IAutoMovieMesh,
  back: IAutoMovieMesh,
  direction: IAutoMovieVector3,
  clearance: number = 0,
): { vertex: number; target: IAutoMovieVector3 }[] {
  const {
    forward,
    across,
    up,
  }: ReturnType<typeof portraitDirectionalContactFrame> =
    portraitDirectionalContactFrame(direction, clearance);
  const measured: { triangle: number; minimum: number }[] =
    measureAutoMovieMeshClearance(
      projectMeshOntoFrame(front, across, up, forward),
      projectMeshOntoFrame(back, across, up, forward),
      "z",
    );
  const indices: number[] =
    front.indices ??
    Array.from(
      { length: front.positions.length / 3 },
      (_: unknown, i: number): number => i,
    );
  const travels: Map<number, number> = new Map<number, number>();
  for (const { triangle, minimum } of measured) {
    const distance: number = clearance - minimum;
    if (distance <= 0) continue;
    for (const vertex of indices.slice(triangle * 3, triangle * 3 + 3))
      travels.set(vertex, Math.max(travels.get(vertex) ?? 0, distance));
  }
  return [...travels].map(
    ([vertex, distance]: [number, number]): {
      vertex: number;
      target: IAutoMovieVector3;
    } => ({
      vertex,
      target: advancePoint(
        Vector3.create(
          front.positions[vertex * 3],
          front.positions[vertex * 3 + 1],
          front.positions[vertex * 3 + 2],
        ),
        forward,
        distance,
      ),
    }),
  );
}
