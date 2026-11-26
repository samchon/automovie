import { Quaternion, AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  IAutoMovieJointAxes,
  IAutoMovieQuaternion,
  IAutoMovieResolvedJointAngles,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { qclose } from "../../internal/qclose";
import { makeRng, randomUnitQuaternion } from "../../internal/random";

/** Rounding of one `atan2` and `asin` extraction. */
const ROUNDING: number = 1e-9;

/** Orientation agreement of a seeded decompose and recompose. */
const ROUND_TRIP: number = 1e-6;

/** Sine and cosine of 45 degrees, the half of a quarter turn. */
const HALF_ROOT_TWO: number = Math.SQRT1_2;

/**
 * `decomposeJointRotation` reads clinical angles from a rotation about the
 * default axes (flexion +X, twist +Y, abduction +Z).
 *
 * Scenarios:
 *
 * 1. A quarter turn about +X is flexion 90, abduction 0, twist 0.
 * 2. A quarter turn about +Y is twist 90 with the others at 0.
 * 3. The identity is all zeros.
 * 4. Non-unit orthogonal custom axes are normalized: 25 degrees about +Y is twist
 *    25 under axes of lengths 2, 3 and 4.
 */
export function test_engine_kinematics_decompose_joint_rotation(): void {
  const flexed: IAutoMovieResolvedJointAngles = AutoMovieEngineKinematics.decomposeJointRotation({
    x: HALF_ROOT_TWO,
    y: 0,
    z: 0,
    w: HALF_ROOT_TWO,
  });
  TestValidator.predicate(
    "flexion",
    nclose(flexed.flexion, 90, ROUNDING) &&
      nclose(flexed.abduction, 0, ROUNDING) &&
      nclose(flexed.twist, 0, ROUNDING),
  );
  const twisted: IAutoMovieResolvedJointAngles = AutoMovieEngineKinematics.decomposeJointRotation({
    x: 0,
    y: HALF_ROOT_TWO,
    z: 0,
    w: HALF_ROOT_TWO,
  });
  TestValidator.predicate(
    "twist",
    nclose(twisted.twist, 90, ROUNDING) &&
      nclose(twisted.flexion, 0, ROUNDING) &&
      nclose(twisted.abduction, 0, ROUNDING),
  );
  const rest: IAutoMovieResolvedJointAngles = AutoMovieEngineKinematics.decomposeJointRotation({
    x: 0,
    y: 0,
    z: 0,
    w: 1,
  });
  TestValidator.predicate(
    "the identity",
    nclose(rest.flexion, 0, ROUNDING) &&
      nclose(rest.abduction, 0, ROUNDING) &&
      nclose(rest.twist, 0, ROUNDING),
  );
  const custom: IAutoMovieResolvedJointAngles = AutoMovieEngineKinematics.decomposeJointRotation(
    {
      x: 0,
      y: Math.sin(Math.PI / 14.4),
      z: 0,
      w: Math.cos(Math.PI / 14.4),
    },
    {
      flexion: { x: 2, y: 0, z: 0 },
      abduction: { x: 0, y: 0, z: 3 },
      twist: { x: 0, y: 4, z: 0 },
    },
  );
  TestValidator.predicate(
    "normalized custom axes",
    nclose(custom.twist, 25, ROUNDING),
  );
  const distal: IAutoMovieJointAxes = {
    flexion: { x: 1, y: 0, z: 0 },
    abduction: { x: 0, y: 1, z: 0 },
    twist: { x: 0, y: 0, z: 1 },
    twistPlacement: "distal",
  };
  const bent: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    distal.flexion,
    125,
  );
  const inDomain: IAutoMovieResolvedJointAngles = AutoMovieEngineKinematics.decomposeJointRotation(
    bent,
    distal,
    undefined,
    {
      bone: "leftLowerArm",
      constraint: {
        flexion: { min: 0, max: 140 },
        abduction: null,
        twist: null,
      },
    },
  );
  TestValidator.predicate(
    "the domain keeps 125 degrees",
    nclose(inDomain.flexion, 125, ROUNDING) &&
      nclose(inDomain.abduction, 0, ROUNDING) &&
      nclose(inDomain.twist, 0, ROUNDING),
  );
  TestValidator.predicate(
    "the principal chart reads 55 degrees",
    nclose(AutoMovieEngineKinematics.decomposeJointRotation(bent, distal).flexion, 55, ROUNDING),
  );
  const clinical: IAutoMovieResolvedJointAngles = AutoMovieEngineKinematics.decomposeJointRotation(
    bent,
    distal,
    { flexion: { sign: -1, neutral: 20 } },
    {
      bone: "leftLowerArm",
      constraint: {
        flexion: { min: -110, max: 20 },
        abduction: null,
        twist: null,
      },
    },
  );
  TestValidator.predicate(
    "a reversed, offset frame",
    nclose(clinical.flexion, -105, ROUNDING),
  );
  const lock: IAutoMovieResolvedJointAngles = AutoMovieEngineKinematics.decomposeJointRotation(
    Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 90),
    {
      flexion: { x: 0, y: 1, z: 0 },
      abduction: { x: 0, y: 0, z: 1 },
      twist: { x: 1, y: 0, z: 0 },
    },
  );
  TestValidator.predicate(
    "gimbal lock",
    nclose(lock.flexion, 0, ROUNDING) && nclose(lock.abduction, 90, ROUNDING),
  );
  const rng: () => number = makeRng(0x2f9a10c3);
  let recomposed: boolean = true;
  for (let index: number = 0; index < 256; ++index) {
    const q: IAutoMovieQuaternion = randomUnitQuaternion(rng);
    recomposed &&= qclose(
      AutoMovieEngineKinematics.jointToQuaternion(AutoMovieEngineKinematics.decomposeJointRotation(q)),
      q,
      ROUND_TRIP,
    );
  }
  TestValidator.predicate("seeded round trips", recomposed);
}
