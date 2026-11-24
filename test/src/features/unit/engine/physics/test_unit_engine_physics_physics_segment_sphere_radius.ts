import { projectileSphereHit, segmentSphere } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

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
 * Sphere collision radii are physical dimensions and must be finite positive
 * numbers before quadratic hit math starts. Squaring an invalid radius must not
 * turn caller bugs into misses, instant hits, or valid positive radii.
 *
 * Scenarios:
 *
 * 1. `segmentSphere` rejects non-positive radii before solving its
 *    quadratic.
 * 2. `projectileSphereHit` inherits the same radius rejection through the sphere
 *    passed into its sampled segment checks.
 */
export function test_unit_engine_physics_physics_segment_sphere_radius(): void {
  const a: IAutoMovieVector3 = v(0, 0, 0);
  const b: IAutoMovieVector3 = v(10, 0, 0);
  const center: IAutoMovieVector3 = v(5, 0, 0);

  for (const radius of [0, -1])
    TestValidator.predicate(
      `segment radius ${radius} throws`,
      throws(
        (): ReturnType<typeof segmentSphere> =>
          segmentSphere(a, b, center, radius),
      ),
    );

  TestValidator.predicate(
    "projectile sphere radius throws",
    throws(
      (): ReturnType<typeof projectileSphereHit> =>
        projectileSphereHit(
          {
            origin: a,
            velocity: v(10, 0, 0),
            gravity: v(0, 0, 0),
          },
          { center, radius: -1 },
          1,
          10,
        ),
    ),
  );
}
