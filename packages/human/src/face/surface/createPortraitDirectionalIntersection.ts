import { advance } from "./advance";
import { contactFrame } from "./contactFrame";
import { project } from "./project";
import { Vector3, createAutoMovieMeshDepthSampler } from "@automovie/engine";
import { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

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
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Resolves an attachment to its actual resident surface while retaining the original observation projection.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-attachments Intersects the foremost triangle in one orthonormal directional frame without first translating the query origin.
 */
export function createPortraitDirectionalIntersection(
  mesh: IAutoMovieMesh,
  direction: IAutoMovieVector3,
): (point: IAutoMovieVector3) => IAutoMovieVector3 | null {
  const { forward, across, up } = contactFrame(direction, 0);
  const sample = createAutoMovieMeshDepthSampler(
    project(mesh, across, up, forward),
    "z",
  );
  return (point) => {
    if (![point.x, point.y, point.z].every(Number.isFinite))
      throw new Error("Directional intersection point must be finite.");
    const hit = sample(Vector3.dot(point, across), Vector3.dot(point, up));
    return hit === null
      ? null
      : advance(point, forward, hit.maximum - Vector3.dot(point, forward));
  };
}
