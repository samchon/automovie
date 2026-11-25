import {
  Quaternion,
  Vector3,
  integrateAirborneRotation,
  resolveAutoMovieMomentum,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBodyMomentum,
  IAutoMovieIntegrateAirborneRotation,
  IAutoMovieQuaternion,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { AIRBORNE_CORE } from "../../internal/AIRBORNE_CORE";
import { airbornePlaced } from "../../internal/airbornePlaced";
import { throwsError } from "../../internal/throwsError";

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
 * 4. Read-back: for the three-mass body whose head and foot oscillate along z (0.3
 *    sin 2 pi t, the foot opposite) over a one second flight of momentum (35,
 *    6, -4), the angular momentum read from the displayed bones (the shape
 *    turned by the integrated orientation) equals the take-off momentum within
 *    1e-3 relative at 20 instants.
 */
export function test_engine_kinematics_resolve_momentum(): void {
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
  TestValidator.predicate("read-back of a moving shape", readBack());
  TestValidator.predicate(
    "zero seconds",
    throwsError((): void => {
      resolveAutoMovieMomentum.between(MODEL, before, after, 0);
    }),
  );
}

/** Scenario 4: the momentum read from the posed bones is the flight's. */
function readBack(): boolean {
  const shape: (
    t: number,
  ) => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = (
    t: number,
  ): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
    airbornePlaced({
      hips: { x: 0, y: 0, z: 0 },
      head: { x: 0, y: 0.6, z: 0.3 * Math.sin(2 * Math.PI * t) },
      leftFoot: { x: 0, y: -0.6, z: -0.3 * Math.sin(2 * Math.PI * t) },
    });
  const turned: (
    t: number,
    q: IAutoMovieQuaternion,
  ) => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = (
    t: number,
    q: IAutoMovieQuaternion,
  ): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
    new Map(
      [...shape(t)].map(
        ([bone, resolved]: [AutoMovieHumanoidBone, IAutoMovieResolvedBone]): [
          AutoMovieHumanoidBone,
          IAutoMovieResolvedBone,
        ] => [
          bone,
          {
            ...resolved,
            worldPosition: Quaternion.rotateVector(q, resolved.worldPosition),
            worldRotation: Quaternion.multiply(q, resolved.worldRotation),
          },
        ],
      ),
    );
  const momentum: { x: number; y: number; z: number } = { x: 35, y: 6, z: -4 };
  const flight: IAutoMovieIntegrateAirborneRotation.IFlight =
    integrateAirborneRotation({
      history: integrateAirborneRotation.history(AIRBORNE_CORE, shape),
      t0: 0,
      t1: 1,
      q0: IDENTITY,
      momentum,
    });
  const step: number = 1e-3;
  let holds: boolean = true;
  for (let index: number = 1; index <= 20; ++index) {
    const t: number = index / 21;
    const read: IAutoMovieVector3 = resolveAutoMovieMomentum(
      AIRBORNE_CORE,
      turned(t - step, flight.orientation(t - step)),
      turned(t + step, flight.orientation(t + step)),
      2 * step,
    ).angular;
    holds &&=
      Vector3.length(Vector3.subtract(read, momentum)) /
        Vector3.length(momentum) <=
      1e-3;
  }
  return holds;
}
