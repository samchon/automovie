import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieVector3 as Point,
} from "@automovie/interface";

import { createMetricMeshPart } from "../../mesh/createMetricMeshPart";
import { createPortraitDirectionalIntersection } from "../../surface/createPortraitDirectionalIntersection";

/**
 * Intersect this emitted support from either side along the recorded camera.
 * The caller supplies construction millimetres. The directional intersection
 * owner projects the original point once, without a preceding depth shift.
 * A point in front of the surface descends to it as well. A missed
 * ray is an unsupported aperture and refuses; it cannot keep a fictitious
 * sphere intersection outside the resident optical disk.
 *
 * The mesh is in head millimetres and is converted once to engine metres by the
 * shared metric part builder; each query point is scaled by 0.001 into metres
 * the same way, intersected, and the hit scaled back by 1000, so the caller
 * sees millimetres on both sides. The direction is the recorded camera ray in
 * the head frame.
 *
 * @evidence contracts/common.md#principled-implementation The intersection of a line along the camera ray with a triangle mesh is delegated to the shared directional-intersection owner, which projects the point once, so this function only converts units at its boundary. Scaling by exactly the factor the metric part builder uses keeps an apex on the transformed footprint instead of one unit in the last place outside it, and a ray that misses the mesh is an unsupported aperture, so it throws instead of inventing a sphere hit.
 * @evidence contracts/common.md#clear-and-simple-design A thin adapter over one shared intersection owner: it builds the metric mesh once and returns a closure that converts, intersects and converts back.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing is special-cased; a miss throws and no fallback surface is substituted, so no compensating path hides an unsupported aperture.
 * @evidence contracts/common.md#meaningful-documentation The comment states the units at each side, the direction, that a point in front of the surface descends to it and that a miss refuses.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres in and out with the head frame preserved, and the conversion to and from engine metres is one explicit factor applied at the boundary and matching the metric part builder.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function projects points and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface; it projects lid points onto the canthal support that another declaration built, and that support is the shared definition.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part and displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function defines and converts no input a caller shapes a face through.
 */
export function createPortraitCanthalIntersection(
  mesh: IAutoMovieMesh,
  direction: Point,
): (point: Point) => Point {
  const metric = createMetricMeshPart("canthal-support", mesh, "skin").geometry
    .mesh;
  const intersect = createPortraitDirectionalIntersection(metric, direction);
  return (point) => {
    // Match createMetricMeshPart's uniform engine scale exactly. Dividing by 1000
    // instead can round an apex one ulp outside its transformed footprint.
    const hit = intersect(Vector3.scale(point, 0.001));
    if (hit === null)
      throw new Error("The observed lid ray misses its canthal support.");
    return Vector3.scale(hit, 1000);
  };
}
