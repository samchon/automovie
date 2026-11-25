import {
  Quaternion,
  Vector3,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanArmSurfaceLift,
  HumanArmTrajectoryModel,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { armTrajectoryReading } from "../../internal/armTrajectoryReading";
import { nclose } from "../../internal/nclose";

/** Two multiplications, one sum and the square root in the unit 3–4–5 triangle. */
const SPHERE_ROUNDING: number = 4 * Number.EPSILON;

/**
 * The palm's allowed surface is the outward side of a convex contact site.
 * On a unit sphere, a front point one quarter metre off the site has positive
 * lift, and the sphere's 3–4–5 point has zero lift despite its lower height
 * along the original normal. From the far point positive ordinary distance
 * conceals an outward ray through the sphere. The site held 1/8 metre above
 * the surface is 2.375 metres ahead, within the model's spatial resolution.
 */
export function test_motions_posture_arm_surface_lift(): void {
  const centre: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const normal: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const shape: NonNullable<Parameters<typeof HumanArmSurfaceLift>[0]["shape"]> = {
    bone: "fixture:surface",
    part: 0,
    pose: { position: centre, rotation: Quaternion.identity() },
    shape: armTrajectoryReading.sphere(1),
    centre,
    radius: 1,
  };
  const at: Parameters<typeof HumanArmSurfaceLift>[0] = {
    point: normal,
    normal,
    shape,
    gap: (p: IAutoMovieVector3): number =>
      physicalShapeSegmentDistance(shape.pose, shape.shape, p, p),
    normalAt: Vector3.normalize,
  };
  TestValidator.equals(
    "a point above the authored face",
    HumanArmSurfaceLift(at, { x: 0, y: 1.25, z: 0 }),
    { metres: 0.25, normal },
  );
  TestValidator.predicate(
    "the tangent disc follows the sphere's outward side",
    nclose(
      HumanArmSurfaceLift(at, { x: 0.6, y: 0.8, z: 0 })!.metres,
      0,
      SPHERE_ROUNDING,
    ),
  );
  const behind: HumanArmSurfaceLift.IReading = HumanArmSurfaceLift(
    { ...at, point: { x: 0, y: 1.125, z: 0 }, height: 1 / 8 },
    { x: 0, y: -1.25, z: 0 },
  )!;
  TestValidator.equals("correct towards the authored side", behind.normal, normal);
  TestValidator.predicate(
    "the opposite clear point lies beyond the outward surface",
    -behind.metres >= 2.375 &&
      -behind.metres - 2.375 <= HumanArmTrajectoryModel.TOLERANCE / 1000,
  );
}
