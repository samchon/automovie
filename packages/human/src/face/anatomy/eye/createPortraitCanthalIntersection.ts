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
 * @evidence contracts/common.md#principled-implementation The recorded head-frame camera direction intersects the actual emitted support bidirectionally after matching canonical millimetre-to-metre multiplication.
 * @evidence contracts/common.md#clear-and-simple-design One metric mesh and canonical directional-intersection reader serve all query points; results convert back to construction millimetres.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missed actual ray refuses rather than retaining an unsupported analytic sphere point or applying a preliminary depth shift.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies head frame, direction, exact conversion factors and unsupported-aperture failure.
 * @evidence contracts/performance.md#efficient-algorithms Metric mesh preparation and the canonical intersection acceleration build cost depend on resident incidence; each query pays its actual directional traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work One prepared support/intersector is reused across queries with unchanged geometry and direction premises.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned closure owns its prepared metric support/intersector until caller release; query vectors expire and no external handle or task is acquired.
 */
export function createPortraitCanthalIntersection(
  mesh: IAutoMovieMesh,
  direction: Point,
): (point: Point) => Point {
  const metric: IAutoMovieMesh = createMetricMeshPart("canthal-support", mesh, "skin").geometry
    .mesh;
  const intersect: (point: Point) => Point | null = createPortraitDirectionalIntersection(metric, direction);
  return (point: Point): Point  => {
    // Match createMetricMeshPart's uniform engine scale exactly. Dividing by 1000
    // instead can round an apex one ulp outside its transformed footprint.
    const hit: Point | null = intersect(Vector3.scale(point, 0.001));
    if (hit === null)
      throw new Error("The observed lid ray misses its canthal support.");
    return Vector3.scale(hit, 1000);
  };
}
