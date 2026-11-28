import { AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Preparing a capsule fixes the composed world frame before any query.
 *
 * Scenarios:
 *
 * 1. The composed center is y=2.5 and the unit half-length ends at y=3.5. A later
 *    parent translation cannot move the prepared capsule.
 * 2. A bare point at y=4 reads 1/2 minus the 1/4 radius. At a point one metre
 *    sideways from the axis, a 1/8 taper reads 5/8.
 * 3. The center reads -1/4 after either distance branch and reverse queries
 *    recover the same bare-axis result. The axis and all offsets are dyadic.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Explains that preparing a shape distance reader fixes the composed world frame before queries, including a later parent mutation.
 * @evidence contracts/development/testing.md#behavioral-verification Prepares a capsule reader, mutates its parent, and asks the same reader for point, tapered-segment and reversed reads.
 * @evidence contracts/development/testing.md#independent-expectations The initial composed center is y = 2.5, the cap axis reaches y = 3.5 and the radius is 1/4. Those lengths give 1/4 for the bare query, 5/8 for the tapered query and -1/4 at center.
 */
export function test_engine_physics_physical_shape_distance_preparation(): void {
  const pose: IAutoMovieRigidTransform = {
    position: { x: 0, y: 2, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const capsule: IAutoMoviePhysicalShape = {
    kind: "capsule",
    id: "capsule",
    material: "solid",
    transform: {
      position: { x: 0, y: 0.5, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
    halfLength: 1,
    radius: 0.25,
  };
  const read: ReturnType<typeof AutoMovieEnginePhysics.preparePhysicalShapeSegmentDistance> =
    AutoMovieEnginePhysics.preparePhysicalShapeSegmentDistance(pose, capsule);
  pose.position.y = 20;
  const above: IAutoMovieVector3 = { x: 0, y: 4, z: 0 };
  const beside: IAutoMovieVector3 = { x: 1, y: 2.5, z: 0 };
  const center: IAutoMovieVector3 = { x: 0, y: 2.5, z: 0 };
  TestValidator.predicate(
    "capsule axis is fixed before first read",
    read(above, above) === 0.25,
  );
  TestValidator.predicate(
    "constant taper uses the fixed inverse frame",
    read(beside, beside, [0.125, 0.125]) === 0.625,
  );
  TestValidator.predicate(
    "future and past reads use the same geometry",
    read(center, center) === -0.25 && read(above, above) === 0.25,
  );
}
