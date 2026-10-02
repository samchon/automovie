import { Vector3, createAutoMovieMeshDepthSampler } from "@automovie/engine";
import { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

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
 *
 * @evidence contracts/common.md#principled-implementation Projecting along a fixed direction turns contact into the engine's one-dimensional depth query: a point behind the foremost triangle at the same (across, up) position advances along the direction to that depth plus clearance, and a clear point or a miss is returned unchanged. The premise is stated: it is directional contact, not a nearest-distance or global collision solver.
 * @evidence contracts/common.md#clear-and-simple-design Composes the shared frame, the projection and the engine depth sampler; it owns only the advance decision.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special case or compensating path; it reads the same triangles the rendered part draws.
 * @evidence contracts/common.md#meaningful-documentation States units (engine metres), the return-the-input-object rule and the limits of directional contact.
 * @evidence contracts/modeling.md#spatial-conventions Mesh, point and clearance all use engine metres in one frame; the frame change is the named projectMeshOntoFrame step.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping createPortraitDirectionalContact is a pure computation and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels createPortraitDirectionalContact defines and consumes no parameter channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry createPortraitDirectionalContact decides no primitive population of a form.
 * @evidenceExclude contracts/modeling.md#shared-boundaries createPortraitDirectionalContact constructs no surface that meets another part.
 * @evidenceExclude contracts/modeling.md#rendered-observation createPortraitDirectionalContact owns no part, group or joint that a viewer displays; its consumers own the observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source createPortraitDirectionalContact carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range createPortraitDirectionalContact admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority createPortraitDirectionalContact defines no input through which a caller shapes a human form.
 */
export function createPortraitDirectionalContact(
  mesh: IAutoMovieMesh,
  direction: IAutoMovieVector3,
  clearance = 0,
): (point: IAutoMovieVector3) => IAutoMovieVector3 {
  const { forward, across, up } = portraitDirectionalContactFrame(
    direction,
    clearance,
  );
  const sample = createAutoMovieMeshDepthSampler(
    projectMeshOntoFrame(mesh, across, up, forward),
    "z",
  );
  return (point) => {
    if (![point.x, point.y, point.z].every(Number.isFinite))
      throw new Error("Directional contact point must be finite.");
    const hit = sample(Vector3.dot(point, across), Vector3.dot(point, up));
    if (hit === null) return point;
    const distance = hit.maximum + clearance - Vector3.dot(point, forward);
    if (distance <= 0) return point;
    return advancePoint(point, forward, distance);
  };
}
