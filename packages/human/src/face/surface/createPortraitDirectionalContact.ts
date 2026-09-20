import { advance } from "./advance";
import { contactFrame } from "./contactFrame";
import { project } from "./project";
import { Vector3, createAutoMovieMeshDepthSampler } from "@automovie/engine";
import { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

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
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Keeps a point clear of its actual supporting mesh along one declared direction without moving its transverse projection.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-attachments Builds an orthonormal query frame, uses the foremost triangle hit and advances only points behind the required nonnegative clearance.
 */
export function createPortraitDirectionalContact(
  mesh: IAutoMovieMesh,
  direction: IAutoMovieVector3,
  clearance = 0,
): (point: IAutoMovieVector3) => IAutoMovieVector3 {
  const { forward, across, up } = contactFrame(direction, clearance);
  const sample = createAutoMovieMeshDepthSampler(
    project(mesh, across, up, forward),
    "z",
  );
  return (point) => {
    if (![point.x, point.y, point.z].every(Number.isFinite))
      throw new Error("Directional contact point must be finite.");
    const hit = sample(Vector3.dot(point, across), Vector3.dot(point, up));
    if (hit === null) return point;
    const distance = hit.maximum + clearance - Vector3.dot(point, forward);
    if (distance <= 0) return point;
    return advance(point, forward, distance);
  };
}
