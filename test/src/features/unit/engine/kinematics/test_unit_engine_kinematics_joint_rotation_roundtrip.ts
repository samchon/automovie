import {
  DEFAULT_JOINT_AXES,
  decomposeJointRotation,
  jointToQuaternion,
} from "@automovie/engine";
import {
  type IAutoMovieJointAxes,
  IAutoMovieQuaternion,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { qclose } from "../../../internal/qclose";
import { makeRng, randomUnitQuaternion } from "../../../internal/random";

/**
 * Clinical decomposition preserves rotations in both Euler charts near gimbal.
 *
 * Scenarios:
 * 1. A fixed seed supplies 256 unit rotations for the default proximal basis.
 * 2. Both twist placements preserve signed turns at 89.95, 89.999 and 90 degrees.
 */
export function test_unit_engine_kinematics_joint_rotation_roundtrip(): void {
  const rng: () => number = makeRng(0x2f9a10c3);
  for (let i: number = 0; i < 256; ++i) {
    const q: IAutoMovieQuaternion = randomUnitQuaternion(rng);
    const recomposed: IAutoMovieQuaternion = jointToQuaternion(
      decomposeJointRotation(q),
    );
    TestValidator.predicate(`seeded round trip #${i}`, qclose(recomposed, q));
  }
  for (const placement of ["proximal", "distal"] as const) {
    const axes: IAutoMovieJointAxes = {
      ...DEFAULT_JOINT_AXES,
      twistPlacement: placement,
    };
    for (const angle of [-90, -89.999, -89.95, 89.95, 89.999, 90]) {
      const q: IAutoMovieQuaternion = jointToQuaternion(
        {
          flexion: placement === "distal" ? angle : 27,
          abduction: placement === "proximal" ? angle : -31,
          twist: 43,
        },
        axes,
      );
      const recomposed: IAutoMovieQuaternion = jointToQuaternion(
        decomposeJointRotation(q, axes),
        axes,
      );
      TestValidator.predicate(
        `${placement} near-gimbal ${angle}`,
        qclose(recomposed, q, 1e-14),
      );
    }
  }
}
