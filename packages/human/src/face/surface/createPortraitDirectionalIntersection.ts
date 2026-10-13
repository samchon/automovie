import { Vector3, createAutoMovieMeshDepthSampler } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import { advancePoint } from "./advancePoint";
import { portraitDirectionalContactFrame } from "./portraitDirectionalContactFrame";
import { projectMeshOntoFrame } from "./projectMeshOntoFrame";

/**
 * Intersect the foremost resident triangle along a fixed forward direction.
 * Inputs and output use engine metres. A point on either side of the surface
 * reaches the same hit; an uncovered projection returns null. Project the
 * original point directly, since moving it along the ray before projection
 * can round a boundary vertex outside the mesh's indexed footprint.
 *
 * The canthal support consumer uses this query for the same faces it draws.
 * Frame construction and mesh projection are shared with directional contact;
 * neither this query nor contact changes the caller's mesh or point.
 * The depth engine snapshots geometry, skips projection-parallel triangles and
 * admits shared projected edges with its 1e-10 barycentric arithmetic allowance.
 * Rebuild the closure after mesh or direction changes.
 *
 * @evidence contracts/common.md#principled-implementation Shared orthonormal projection and barycentric depth interpolation identify the foremost covered triangle; signed forward travel reaches that same hit from either side.
 * @evidence contracts/common.md#clear-and-simple-design This constructor owns intersection/null semantics while shared frame, projection, depth index and finite displacement helpers own their respective calculations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The original point is projected directly to avoid an extra boundary-rounding step; the parallel-face omission and edge allowance do not certify closed-volume collision.
 * @evidence contracts/common.md#meaningful-documentation Prose gives metre units, nullable uncovered projections, signed travel, snapshot invalidation and unchanged caller geometry.
 * @evidence contracts/performance.md#efficient-algorithms O(V) projection and triangle-to-cell compilation precede repeated one-cell queries; a dense cell can contain every projected triangle.
 * @evidence contracts/performance.md#reuse-equivalent-work All queries share one fixed frame and snapshot index; equivalence ends when either source geometry or the supplied direction changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure owns only axes and projected index storage until dropped; no source mesh, history, task or handle is retained.
 */
export function createPortraitDirectionalIntersection(
  mesh: IAutoMovieMesh,
  direction: IAutoMovieVector3,
): (point: IAutoMovieVector3) => IAutoMovieVector3 | null {
  const { forward, across, up }: ReturnType<typeof portraitDirectionalContactFrame> = portraitDirectionalContactFrame(direction, 0);
  const sample: ReturnType<typeof createAutoMovieMeshDepthSampler> = createAutoMovieMeshDepthSampler(
    projectMeshOntoFrame(mesh, across, up, forward),
    "z",
  );
  return (point: IAutoMovieVector3): IAutoMovieVector3 | null => {
    if (![point.x, point.y, point.z].every(Number.isFinite))
      throw new Error("Directional intersection point must be finite.");
    const hit: { minimum: number; maximum: number } | null = sample(Vector3.dot(point, across), Vector3.dot(point, up));
    return hit === null
      ? null
      : advancePoint(point, forward, hit.maximum - Vector3.dot(point, forward));
  };
}
