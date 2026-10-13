import { Vector3, minimizeAutoMovieMeshClearance } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import { advancePoint } from "./advancePoint";
import { portraitDirectionalContactFrame } from "./portraitDirectionalContactFrame";
import { projectMeshOntoFrame } from "./projectMeshOntoFrame";

/**
 * Minimize complete-triangle contact travel in the same frame used by the
 * resident intersection and conservative contact queries. Every original
 * overlap condition survives the engine's joint solve, while incident face
 * deficits bound how far any vertex may advance. The consumer owns subsequent
 * skin propagation, seam correspondence, normals and exported contact checks.
 * Coordinates, clearance and targets are engine metres. The engine minimizes
 * lumped-area weighted squared travel with nonnegative face-deficit caps; its
 * normalized 1e-7 residual within 40 rounds is solver precision, not tissue
 * tolerance or added clearance. Failed solves refuse without a fallback.
 *
 * @evidence contracts/common.md#principled-implementation Shared projection feeds the engine's convex bounded-displacement solve over every affine overlap witness; returned vertex travel is lifted through the identical forward axis.
 * @evidence contracts/common.md#clear-and-simple-design Projection and target conversion belong here; witness admission, mass lumping, variable caps and the active-set solve remain with the existing engine owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The solver's 1e-7 normalized residual and 40-round budget do not relax anatomical clearance, and failure does not silently select conservative travel; parallel-face omission and downstream checks remain.
 * @evidence contracts/common.md#meaningful-documentation Prose gives common metre units, objective/caps, solver precision, failure behavior and propagation/export responsibilities.
 * @evidence contracts/performance.md#efficient-algorithms Projecting both meshes is linear in vertices; overlapping-pair measurement and the bounded solver dominate, with one variable per positive-cap vertex and one constraint per overlap witness.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each solve consumes the current two geometries; moved vertices invalidate the measurement and rows, and this adapter retains no cross-request solution.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Projected meshes and engine witness/solver arrays are call-local; only ascending-vertex target records escape, with no persistent task or handle.
 */
export function portraitMinimumDirectionalSurfaceTargets(
  front: IAutoMovieMesh,
  back: IAutoMovieMesh,
  direction: IAutoMovieVector3,
  clearance: number = 0,
): { vertex: number; target: IAutoMovieVector3 }[] {
  const { forward, across, up }: ReturnType<typeof portraitDirectionalContactFrame> = portraitDirectionalContactFrame(
    direction,
    clearance,
  );
  return minimizeAutoMovieMeshClearance(
    projectMeshOntoFrame(front, across, up, forward),
    projectMeshOntoFrame(back, across, up, forward),
    "z",
    clearance,
  ).map(({ vertex, distance }: { vertex: number; distance: number }): { vertex: number; target: IAutoMovieVector3 } => ({
    vertex,
    target: advancePoint(
      Vector3.create(
        ...(front.positions.slice(3 * vertex, 3 * vertex + 3) as [
          number,
          number,
          number,
        ]),
      ),
      forward,
      distance,
    ),
  }));
}
