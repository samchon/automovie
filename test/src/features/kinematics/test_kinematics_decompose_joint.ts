import { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMovieJointAxes } from "../../../../packages/engine/src/kinematics/IAutoMovieJointAxes";
import { type IAutoMovieResolvedJointAngles } from "../../../../packages/engine/src/kinematics/IAutoMovieResolvedJointAngles";
import { decomposeJointRotation } from "../../../../packages/engine/src/kinematics/decomposeJointRotation";
import { jointToQuaternion } from "../../../../packages/engine/src/kinematics/jointToQuaternion";
import { Quaternion } from "../../../../packages/engine/src/math/Quaternion";
import { type IAutoMovieQuaternion } from "../../../../packages/interface/src/index";
import { namedFacts } from "../internal/namedFacts";
import { nclose } from "../internal/nclose";
import { vclose } from "../internal/vclose";

const DEFAULT_AXES: IAutoMovieJointAxes = {
  flexion: { x: 1, y: 0, z: 0 },
  abduction: { x: 0, y: 0, z: 1 },
  twist: { x: 0, y: 1, z: 0 },
};
// The humanoid arm basis (flexion→Y, abduction→Z, twist→X): right-handed.
const ARM_AXES: IAutoMovieJointAxes = {
  flexion: { x: 0, y: 1, z: 0 },
  abduction: { x: 0, y: 0, z: 1 },
  twist: { x: 1, y: 0, z: 0 },
};

const PROBES: IAutoMovieVector3[] = [
  { x: 1, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 },
  { x: 0, y: 0, z: 1 },
  { x: 0.4, y: -0.7, z: 0.55 },
];

/** Compare both rotations' action on every fixed probe within 1e-4 per coordinate. */
const rotationsMatch: (
  q: ReturnType<typeof jointToQuaternion>,
  r: ReturnType<typeof jointToQuaternion>,
) => boolean = (
  q: ReturnType<typeof jointToQuaternion>,
  r: ReturnType<typeof jointToQuaternion>,
): boolean =>
  PROBES.every((v: IAutoMovieVector3): boolean =>
    vclose(Quaternion.rotateVector(q, v), Quaternion.rotateVector(r, v), 1e-4),
  );

/**
 * `decomposeJointRotation`: the inverse of `jointToQuaternion`. The contract is
 * the round-trip: `jointToQuaternion(decompose(q, axes), axes)` is the same
 * rotation as `q`, for any bone-local rotation and any orthonormal axis basis
 * (right- or left-handed). This is the lowering an IK solver needs: quaternion
 * bone rotations back into clinical flexion/abduction/twist.
 *
 * Scenarios:
 *
 * 1. Round-trip on the right-handed arm basis for a spread of angle triples (pure
 *    flexion / abduction / twist, and mixed): the reconstructed rotation
 *    matches the original on every probe vector.
 * 2. Round-trip on the left-handed default clinical basis (flex×abd = −twist),
 *    exercising the handedness correction: same match.
 * 3. Gimbal lock: abduction at exactly ±90° (flexion folds into twist) still
 *    round-trips, and the recovered abduction is ±90 with flexion pinned to 0.
 * 4. Pure-axis recovery reads a 40° flexion back as (40, 0, 0) in the arm
 *    basis within the existing strict 1e-4 degree component tolerances.
 *
 * @evidence contracts/testing.md#behavioral-verification Decomposes and recomposes rotations under both handed axis bases, comparing their action on probe vectors and recovered pure/gimbal coordinates; wrong handedness or lost gimbal orientation fails.
 * @evidence contracts/testing.md#independent-expectations Authored angle triples and the gimbal convention define coordinate expectations, but forward/inverse round trips share jointToQuaternion and Quaternion.rotateVector and can miss coordinated errors. The pure-axis coordinate check supplies a known value without proving every rotation convention independently.
 * @evidence contracts/testing.md#distinguishing-cases Keeps six pure/mixed triples under both bases, positive/negative90 gimbals and pure40 recovery; invalid scalar/axis admission and constrained alternate charts have separate entries.
 * @evidence contracts/testing.md#execution-ownership The test runner discovers this exported CPU entry; local probe arrays and actual math/kinematics source run without a native solver, Human asset, process, browser or GPU.
 */
export function test_kinematics_decompose_joint(): void {
  const triples: { flexion: number; abduction: number; twist: number }[] = [
    { flexion: 40, abduction: 0, twist: 0 },
    { flexion: 0, abduction: 35, twist: 0 },
    { flexion: 0, abduction: 0, twist: 55 },
    { flexion: 25, abduction: -20, twist: 15 },
    { flexion: -50, abduction: 30, twist: -40 },
    { flexion: 70, abduction: -60, twist: 80 },
  ];

  for (const axes of [ARM_AXES, DEFAULT_AXES])
    for (const t of triples) {
      const q: IAutoMovieQuaternion = jointToQuaternion(t, axes);
      const back: IAutoMovieResolvedJointAngles = decomposeJointRotation(
        q,
        axes,
      );
      const q2: IAutoMovieQuaternion = jointToQuaternion(back, axes);
      TestValidator.predicate(
        `round-trips ${JSON.stringify(t)} (${axes === ARM_AXES ? "arm" : "default"})`,
        rotationsMatch(q, q2),
      );
    }

  // 3. gimbal lock at ±90° abduction
  for (const abduction of [90, -90]) {
    const q: IAutoMovieQuaternion = jointToQuaternion(
      { flexion: 20, abduction, twist: 30 },
      ARM_AXES,
    );
    const back: IAutoMovieResolvedJointAngles = decomposeJointRotation(
      q,
      ARM_AXES,
    );
    TestValidator.equals(
      `gimbal ${abduction}° pins flexion 0, keeps abduction`,
      namedFacts([
        ["backFlexion", (): boolean => nclose(back.flexion, 0, 0)],
        [
          "absAbsBack",
          (): boolean =>
            nclose(back.flexion, 0, 0) &&
            nclose(Math.abs(back.abduction), 90, 1e-6) &&
            Math.abs(Math.abs(back.abduction) - 90) < 1e-6,
        ],
      ]),
      { backFlexion: true, absAbsBack: true },
    );
    TestValidator.predicate(
      `gimbal ${abduction}° still round-trips`,
      rotationsMatch(q, jointToQuaternion(back, ARM_AXES)),
    );
  }

  // 4. pure-axis recovery reads the exact angle
  const pure: IAutoMovieResolvedJointAngles = decomposeJointRotation(
    jointToQuaternion({ flexion: 40, abduction: 0, twist: 0 }, ARM_AXES),
    ARM_AXES,
  );
  TestValidator.equals(
    "a pure 40° flexion decomposes back to (40, 0, 0)",
    namedFacts([
      [
        "MathAbsPure",
        (): boolean =>
          nclose(pure.flexion, 40, 1e-4) && Math.abs(pure.flexion - 40) < 1e-4,
      ],
      [
        "MathAbsPure2",
        (): boolean =>
          nclose(pure.abduction, 0, 1e-4) && Math.abs(pure.abduction) < 1e-4,
      ],
      [
        "MathAbsPure3",
        (): boolean =>
          nclose(pure.twist, 0, 1e-4) && Math.abs(pure.twist) < 1e-4,
      ],
    ]),
    { MathAbsPure: true, MathAbsPure2: true, MathAbsPure3: true },
  );
}
