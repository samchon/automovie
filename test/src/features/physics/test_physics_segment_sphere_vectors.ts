import { projectileSphereHit, segmentSphere } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

const v: (x: number, y: number, z: number) => IAutoMovieVector3 = (
  x: number,
  y: number,
  z: number,
): IAutoMovieVector3 => ({ x, y, z });

const throws: (task: () => void) => boolean = (task: () => void): boolean => {
  try {
    task();
    return false;
  } catch {
    return true;
  }
};

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
 *
 * @evidence contracts/testing.md#behavioral-verification Rejects non-finite segment or center vectors through both collision entries and checks a valid entry parameter, catching invalid roots silently converted into misses while preserving finite intersections.
 * @evidence contracts/testing.md#independent-expectations Finite vector admission and authored one-dimensional geometry give refusal and entry 0.4 independently of implementation output; exceptions are checked for presence rather than identity.
 * @evidence contracts/testing.md#distinguishing-cases Separates invalid start, end and center, inherited projectile-center admission and a finite positive twin; radius and timing admission belong to neighboring units.
 * @evidence contracts/testing.md#execution-ownership The named exported portable unit supplies local records and owns every assertion without real processes, browsers, GPUs or dynamic cases.
 */
export function test_physics_segment_sphere_vectors(): void {
  const a: IAutoMovieVector3 = v(0, 0, 0);
  const b: IAutoMovieVector3 = v(10, 0, 0);
  const center: IAutoMovieVector3 = v(5, 0, 0);

  TestValidator.predicate(
    "non-finite segment start throws",
    throws(
      (): ReturnType<typeof segmentSphere> =>
        segmentSphere(v(Number.NaN, 0, 0), b, center, 1),
    ),
  );
  TestValidator.predicate(
    "non-finite segment end throws",
    throws(
      (): ReturnType<typeof segmentSphere> =>
        segmentSphere(a, v(10, Infinity, 0), center, 1),
    ),
  );
  TestValidator.predicate(
    "non-finite sphere center throws",
    throws(
      (): ReturnType<typeof segmentSphere> =>
        segmentSphere(a, b, v(5, 0, -Infinity), 1),
    ),
  );
  TestValidator.predicate(
    "projectile sphere center throws",
    throws(
      (): ReturnType<typeof projectileSphereHit> =>
        projectileSphereHit(
          {
            origin: a,
            velocity: v(10, 0, 0),
            gravity: v(0, 0, 0),
          },
          { center: v(Number.NaN, 0, 0), radius: 1 },
          1,
          10,
        ),
    ),
  );

  TestValidator.predicate(
    "finite segment hit remains unchanged",
    nclose(segmentSphere(a, b, center, 1)!, 0.4),
  );
}
