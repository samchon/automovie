import { Quaternion } from "@automovie/engine";
import type { IAutoMovieQuaternion } from "@automovie/interface";

import { jointRotationOracle as O } from "../internal/jointRotationOracle";

/**
 * Projection onto a bounded hinge discards the perpendicular rotation and clips the requested flexion.
 *
 * Scenarios:
 * 1. Evaluate the operation at the interior and the limiting case.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Projection onto a bounded hinge discards the perpendicular rotation and clips the requested flexion.
 * @evidence contracts/development/testing.md#independent-expectations The absolute quaternion dot with the hinge is proportional to cos((75°−angle)/2), maximized at the allowed 40° endpoint.
 * @evidence contracts/development/testing.md#distinguishing-cases The boundary outcome distinguishes physical change from normalization.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_rotation_projection(): void {
  const checks: O.IChecks = O.of();
  const rig: O.IRig = O.rig({
    flexion: { min: -25, max: 40 },
    abduction: null,
    twist: null,
  });
  const target: IAutoMovieQuaternion = Quaternion.multiply(
    Quaternion.fromAxisAngle(O.CANONICAL.flexion, 75),
    Quaternion.fromAxisAngle(O.CANONICAL.abduction, 60),
  );
  const expected: IAutoMovieQuaternion = O.compose([40, 0, 0], rig);
  checks.run(
    "off-axis target projects to hinge boundary",
    rig,
    target,
    expected,
  );
  checks.run(
    "antipodal target",
    rig,
    { x: -target.x, y: -target.y, z: -target.z, w: -target.w },
    expected,
  );
  checks.assert();
}
