import { segmentSphere } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/predicates";

const v: (x: number, y: number, z: number) => IAutoMovieVector3 = (
  x: number,
  y: number,
  z: number,
): IAutoMovieVector3 => ({ x, y, z });

/**
 * Segment/sphere collision vectors must be finite before quadratic hit math.
 * Invalid vector components otherwise become `NaN` roots and can be mistaken
 * for a clean miss.
 *
 * Scenarios:
 *
 * 1. Non-finite segment start, segment end, and sphere center components throw.
 * 2. `projectileSphereHit` inherits center-vector rejection through sampled
 *    segment checks.
 * 3. Finite segment/sphere intersection behavior is preserved.
 */
export function test_unit_engine_physics_physics_segment_sphere_vectors(): void {
  const a: IAutoMovieVector3 = v(0, 0, 0);
  const b: IAutoMovieVector3 = v(10, 0, 0);
  const center: IAutoMovieVector3 = v(5, 0, 0);

  TestValidator.predicate(
    "finite segment hit remains unchanged",
    nclose(segmentSphere(a, b, center, 1)!, 0.4),
  );
}
