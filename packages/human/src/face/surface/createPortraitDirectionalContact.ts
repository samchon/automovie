import { Vector3, createAutoMovieMeshDepthSampler } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import { advancePoint } from "./advancePoint";
import { portraitDirectionalContactFrame } from "./portraitDirectionalContactFrame";
import { projectMeshOntoFrame } from "./projectMeshOntoFrame";

/**
 * Contact against the actual resident surface along one declared direction.
 * Mesh, point and clearance use engine metres. A point behind the foremost hit
 * moves along the normalized direction to that hit plus nonnegative clearance.
 * An already clear point or a ray missing the surface returns the input object.
 *
 * The orthonormal frame turns arbitrary rays into the engine's depth query;
 * interpolation therefore uses the same mesh triangles as the rendered part.
 * This is directional contact, not a nearest-distance or global collision solver.
 * It preserves each point's projection onto the plane normal to the direction.
 * The compiled depth index owns a snapshot; mesh edits require a new query.
 * Projection-parallel triangles are skipped by the depth engine, and shared
 * projected edges use its existing 1e-10 barycentric arithmetic allowance.
 *
 * @evidence contracts/common.md#principled-implementation One orthonormal projection feeds exact planar barycentric depth interpolation; maximum depth plus clearance determines nonnegative forward travel and leaves clear or uncovered points unchanged.
 * @evidence contracts/common.md#clear-and-simple-design Frame, position projection and finite displacement have shared owners; this constructor owns a reusable depth sampler and contact decision.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No nearest-distance or closed-volume guarantee is inferred from this directional envelope; the engine's parallel-face omission and edge allowance remain explicit.
 * @evidence contracts/common.md#meaningful-documentation Prose specifies metre units, unchanged-object cases, snapshot invalidation, projection preservation and the directional query's limitations.
 * @evidence contracts/performance.md#efficient-algorithms Projection is O(V); depth compilation indexes every projected triangle in its touched 32-by-32 cells, and each point visits one cell's candidates, worst-case all triangles.
 * @evidence contracts/performance.md#reuse-equivalent-work The frame and snapshotted index are compiled once for all closure calls; a changed mesh, direction or clearance requires a fresh constructor.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains three axes, clearance and the engine's projected triangle/cell index until dropped; it keeps no input mesh or query history.
 */
export function createPortraitDirectionalContact(
  mesh: IAutoMovieMesh,
  direction: IAutoMovieVector3,
  clearance: number = 0,
): (point: IAutoMovieVector3) => IAutoMovieVector3 {
  const {
    forward,
    across,
    up,
  }: ReturnType<typeof portraitDirectionalContactFrame> =
    portraitDirectionalContactFrame(direction, clearance);
  const sample: ReturnType<typeof createAutoMovieMeshDepthSampler> =
    createAutoMovieMeshDepthSampler(
      projectMeshOntoFrame(mesh, across, up, forward),
      "z",
    );
  return (point: IAutoMovieVector3): IAutoMovieVector3 => {
    if (![point.x, point.y, point.z].every(Number.isFinite))
      throw new Error("Directional contact point must be finite.");
    const hit: { minimum: number; maximum: number } | null = sample(
      Vector3.dot(point, across),
      Vector3.dot(point, up),
    );
    if (hit === null) return point;
    const distance: number =
      hit.maximum + clearance - Vector3.dot(point, forward);
    if (distance <= 0) return point;
    return advancePoint(point, forward, distance);
  };
}
