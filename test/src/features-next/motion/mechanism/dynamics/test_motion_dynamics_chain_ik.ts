import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { motionFitArms } from "../../../../features/internal/motionFitArms";

const { arms, fit, fk } = motionFitArms;

/**
 * The two-link inverse fit meets the reachable wrist and the straight-arm reach boundary.
 *
 * Scenarios:
 * 1. Construct the elbow circle from the two link lengths and test a target beyond their sum.
 *
 * @evidence contracts/development/testing.md#behavioral-verification The two-link inverse fit meets the reachable wrist and the straight-arm reach boundary.
 * @evidence contracts/development/testing.md#independent-expectations The intersection of spheres fixes the elbow plane and radius; at full reach the endpoint lies on the target ray.
 * @evidence contracts/development/testing.md#distinguishing-cases A bend hint chooses a hemisphere only on the interior of the annulus.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_chain_ik(): void {
  const skeleton: IAutoMovieSkeleton = arms();
  const failures: string[] = [];
  const check = (label: string, ok: boolean): void => {
    if (!ok) failures.push(label);
  };
  const shoulder: IAutoMovieVector3 = { x: 0.18, y: 1.5, z: 0 };
  const target: IAutoMovieVector3 = { x: -0.16, y: 1.28, z: 0.14 };
  const bend: IAutoMovieVector3 = { x: 0.2, y: 1.215, z: 0.06 };
  const displacement: IAutoMovieVector3 = Vector3.subtract(target, shoulder);
  const distance: number = Vector3.length(displacement);
  const axis: IAutoMovieVector3 = Vector3.normalize(displacement);
  const projection: number =
    (0.3 ** 2 - 0.25 ** 2 + distance ** 2) / (2 * distance);
  const radius: number = Math.sqrt(0.3 ** 2 - projection ** 2);
  const center: IAutoMovieVector3 = Vector3.add(
    shoulder,
    Vector3.scale(axis, projection),
  );
  const left: IAutoMoviePose = fit(skeleton, "left", target, bend);
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = fk(
    skeleton,
    left,
  );
  const radial: IAutoMovieVector3 = Vector3.subtract(
    bones.get("leftLowerArm")!.worldPosition,
    center,
  );
  check(
    "wrist meets the cross-body target",
    Vector3.length(
      Vector3.subtract(bones.get("leftHand")!.worldPosition, target),
    ) <= 0.001,
  );
  check(
    "elbow lies in the intersection plane",
    Math.abs(Vector3.dot(radial, axis)) <= 0.001,
  );
  check(
    "elbow lies on the intersection circle",
    Math.abs(Vector3.length(radial) - radius) <= 0.001,
  );
  check(
    "the hint selects the elbow hemisphere",
    Vector3.dot(radial, Vector3.subtract(bend, center)) > 0,
  );

  /** Reflect a world point in the fixture's sagittal plane. */
  // 4. Unreachable: the straight arm along the line to the target.
  const far: IAutoMovieVector3 = { x: 0.6, y: 1.9, z: 1.9 };
  const reached: IAutoMovieVector3 = fk(
    skeleton,
    fit(skeleton, "left", far, { x: 0.4, y: 1.2, z: 0 }),
  ).get("leftHand")!.worldPosition;
  const line: IAutoMovieVector3 = Vector3.add(
    shoulder,
    Vector3.scale(Vector3.normalize(Vector3.subtract(far, shoulder)), 0.55),
  );
  check(
    `unreachable: straight arm toward the target (${(Vector3.length(Vector3.subtract(reached, line)) * 1000).toFixed(2)} mm)`,
    Vector3.length(Vector3.subtract(reached, line)) <= 0.001,
  );
  TestValidator.predicate(
    failures.join("; ") || "all checks",
    failures.length === 0,
  );
}
