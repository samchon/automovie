import { Vector3, createAutoMovieMeshDepthSampler } from "@automovie/engine";
import { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

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
 *
 * @evidence contracts/common.md#principled-implementation Projecting the original point and reading the foremost depth gives the intersection of the line through the point with the resident surface along the direction; the documented reason for projecting before moving is that moving first can round a boundary vertex outside the footprint.
 * @evidence contracts/common.md#clear-and-simple-design Shares the frame and projection owners with the contact constructor and adds only the intersection query.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special case or compensating path.
 * @evidence contracts/common.md#meaningful-documentation States the null-on-miss result, units, and why the original point is projected.
 * @evidence contracts/modeling.md#spatial-conventions Engine metres in one frame; the change of frame is the named projectMeshOntoFrame step.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping createPortraitDirectionalIntersection is a pure computation and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels createPortraitDirectionalIntersection defines and consumes no parameter channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry createPortraitDirectionalIntersection decides no primitive population of a form.
 * @evidenceExclude contracts/modeling.md#shared-boundaries createPortraitDirectionalIntersection constructs no surface that meets another part.
 * @evidenceExclude contracts/modeling.md#rendered-observation createPortraitDirectionalIntersection owns no part, group or joint that a viewer displays; its consumers own the observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source createPortraitDirectionalIntersection carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range createPortraitDirectionalIntersection admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority createPortraitDirectionalIntersection defines no input through which a caller shapes a human form.
 */
export function createPortraitDirectionalIntersection(
  mesh: IAutoMovieMesh,
  direction: IAutoMovieVector3,
): (point: IAutoMovieVector3) => IAutoMovieVector3 | null {
  const { forward, across, up } = portraitDirectionalContactFrame(direction, 0);
  const sample = createAutoMovieMeshDepthSampler(
    projectMeshOntoFrame(mesh, across, up, forward),
    "z",
  );
  return (point) => {
    if (![point.x, point.y, point.z].every(Number.isFinite))
      throw new Error("Directional intersection point must be finite.");
    const hit = sample(Vector3.dot(point, across), Vector3.dot(point, up));
    return hit === null
      ? null
      : advancePoint(point, forward, hit.maximum - Vector3.dot(point, forward));
  };
}
