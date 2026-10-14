import { IAutoMovieQuaternion } from "@automovie/interface";
import { decomposeJointRotation } from "../../../../packages/engine/src/kinematics/decomposeJointRotation";
import { jointToQuaternion } from "../../../../packages/engine/src/kinematics/jointToQuaternion";
import { DEFAULT_JOINT_AXES } from "../../../../packages/engine/src/kinematics/constants/DEFAULT_JOINT_AXES";
import { IAutoMovieJointAxes } from "../../../../packages/engine/src/kinematics/IAutoMovieJointAxes";
import { TestValidator } from "@nestia/e2e";
import { qclose } from "../internal/qclose";
import { makeRng, randomUnitQuaternion } from "../internal/random";
/**
 * Clinical decomposition preserves rotations in both Euler charts near gimbal.
 *
 * Scenarios:
 * 1. A fixed seed supplies 256 unit rotations for the default proximal basis.
 * 2. Both twist placements preserve signed turns at 89.95, 89.999 and 90 degrees.
 *
 * @evidence contracts/testing.md#behavioral-verification Recomposes decomposed rotations and compares quaternion rotations, catching the former 0.999999 sine threshold that snapped a resolvable near-gimbal turn to ninety degrees.
 * @evidence contracts/testing.md#independent-expectations Seeded input rotations and explicitly authored clinical rotations are the unchanged expected orientations; quaternion sign equivalence is allowed, with a tighter dot-product tolerance for the named gimbal boundaries. The authored boundary rotations use the shared forward converter, so replay alone cannot independently prove that converter's angle convention.
 * @evidence contracts/testing.md#distinguishing-cases Random orientations complement both signed gimbals and their resolvable neighbors for proximal and distal placement; joint ROM tests own equivalent-chart selection under constraints.
 * @evidence contracts/testing.md#execution-ownership This exported unit entry owns its deterministic sweep and boundary cases and calls portable kinematics source without a rig application, process or renderer.
 */
export function test_kinematics_joint_rotation_roundtrip(): void {
  const rng: () => number = makeRng(0x2f9a10c3);
  for (let i: number = 0; i < 256; ++i) {
    const q: IAutoMovieQuaternion = randomUnitQuaternion(rng);
    const recomposed: IAutoMovieQuaternion = jointToQuaternion(decomposeJointRotation(q));
    TestValidator.predicate(`seeded round trip #${i}`, qclose(recomposed, q));
  }
  for (const placement of ["proximal", "distal"] as const) {
    const axes: IAutoMovieJointAxes = { ...DEFAULT_JOINT_AXES, twistPlacement: placement };
    for (const angle of [-90, -89.999, -89.95, 89.95, 89.999, 90]) {
      const q: IAutoMovieQuaternion = jointToQuaternion(
        { flexion: placement === "distal" ? angle : 27, abduction: placement === "proximal" ? angle : -31, twist: 43 },
        axes,
      );
      const recomposed: IAutoMovieQuaternion = jointToQuaternion(decomposeJointRotation(q, axes), axes);
      TestValidator.predicate(`${placement} near-gimbal ${angle}`, qclose(recomposed, q, 1e-14));
    }
  }
}
