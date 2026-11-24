import {
  Quaternion,
  Vector3,
  resolveAutoMovieMomentum,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBodyMomentum,
  IAutoMovieQuaternion,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/** Rounding of a few unit-mass sums and one finite difference. */
const ROUNDING: number = 1e-9;

/** The identity orientation. */
const IDENTITY: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };

/** Two thin rings of mass 1 and intrinsic moments (2, 1, 1) at x = -1 and +1. */
const MODEL: IAutoMovieResolveCenterOfMass.IModel = {
  mass: 2,
  segments: (["hips", "head"] as const).map(
    (bone: "hips" | "head"): IAutoMovieResolveCenterOfMass.ISegment => ({
      bone,
      mass: 1,
      point: { x: 0, y: 0, z: 0 },
      inertia: { x: 2, y: 1, z: 1 },
      axes: IDENTITY,
    }),
  ),
};

/** The rings, both turned about X by 0.25 rad per second of `t`. */
const bones: (
  t: number,
) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = (
  t: number,
): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
  const rotation: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 1, y: 0, z: 0 },
    (0.25 * t * 180) / Math.PI,
  );
  return new Map(
    MODEL.segments.map(
      (
        part: IAutoMovieResolveCenterOfMass.ISegment,
        index: number,
      ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [
        part.bone,
        {
          bone: part.bone,
          localRotation: rotation,
          worldRotation: rotation,
          worldPosition: { x: index === 0 ? -1 : 1, y: 0, z: 0 },
        },
      ],
    ),
  );
};

/**
 * `resolveAutoMovieMomentum` reduces posed parts to a centre of mass, an
 * inertia tensor and, between two poses, a linear and angular momentum.
 *
 * Scenarios, on the ring pair spinning about X at 0.25 rad/s:
 *
 * 1. Between the poses at 0.25 s and 0.75 s the centre is the origin and the
 *    linear momentum 0; the angular momentum is 2 rings x 2 kg m^2 x 0.25 rad/s
 *    = (1, 0, 0).
 * 2. The composite tensor is 4 I: the intrinsic (2, 1, 1) plus the parallel-axis
 *    terms (0, 2, 2) of masses 1 at distance 1.
 * 3. An interval of zero seconds is refused.
 */
export function test_unit_engine_kinematics_resolve_momentum(): void {
  const before: resolveAutoMovieMomentum.IPosed = resolveAutoMovieMomentum.pose(
    MODEL,
    bones(0.25),
  );
  const after: resolveAutoMovieMomentum.IPosed = resolveAutoMovieMomentum.pose(
    MODEL,
    bones(0.75),
  );
  const momentum: IAutoMovieBodyMomentum = resolveAutoMovieMomentum.between(
    MODEL,
    before,
    after,
    0.5,
  );
  TestValidator.predicate(
    "stationary centre, spin momentum",
    Vector3.length(before.centre) <= ROUNDING &&
      Vector3.length(after.centre) <= ROUNDING &&
      Vector3.length(momentum.linear) <= ROUNDING &&
      Vector3.length(
        Vector3.subtract(momentum.angular, { x: 1, y: 0, z: 0 }),
      ) <= ROUNDING,
  );
  const tensor: number[][] = resolveAutoMovieMomentum.inertia(
    MODEL,
    bones(0.5),
  );
  TestValidator.predicate(
    "the composite tensor",
    tensor.every((row: number[], i: number): boolean =>
      row.every(
        (value: number, j: number): boolean =>
          Math.abs(value - (i === j ? 4 : 0)) <= ROUNDING,
      ),
    ),
  );
  TestValidator.predicate(
    "zero seconds",
    throwsError((): void => {
      resolveAutoMovieMomentum.between(MODEL, before, after, 0);
    }),
  );
}
