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
