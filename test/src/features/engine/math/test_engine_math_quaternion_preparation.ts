import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { qclose } from "../../internal/qclose";

/**
 * Allow 32 rounded operations on unit-scale scalars for the weights and final
 * normalization.
 */
const ROTATION_ROUNDING: number = 32 * Number.EPSILON;

/**
 * Prepared rotations snapshot their arguments in setup and return a fresh value
 * for every angle or progress read, including the first.
 *
 * Scenarios:
 *
 * 1. An axis of length 2 on +Z gives the analytic half and quarter turns even
 *    after its original direction changes before the first read.
 * 2. The shorter arc to an endpoint of opposite sign is also fixed in setup.
 *    Mutating both parameter records and a returned rotation cannot change the
 *    quarter or half reads along the original 120-degree arc.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers snapshots before the first prepared read, the short slerp arc and independent output records.
 * @evidence contracts/development/testing.md#behavioral-verification Prepares the axis and the slerp endpoints, mutates the source records before reading, then mutates an output and reads again in a different order.
 * @evidence contracts/development/testing.md#independent-expectations Half-angle values independently give the half and quarter turns around +Z, and an original 120-degree arc gives 30 and 60 degrees at quarter and half shares. The fixed rounding tolerance comes from the scalar operation budget.
 */
export function test_engine_math_quaternion_preparation(): void {
  const axis: IAutoMovieVector3 = { x: 0, y: 0, z: 2 };
  const aboutZ: (angle: number) => IAutoMovieQuaternion =
    AutoMovieEngineQuaternion.prepareAxisAngle(axis);
  axis.x = 2;
  axis.z = 0;
  TestValidator.predicate(
    "the prepared axis stays on +Z before and after its first read",
    qclose(aboutZ(180), { x: 0, y: 0, z: 1, w: 0 }, ROTATION_ROUNDING) &&
      qclose(
        aboutZ(90),
        { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 },
        ROTATION_ROUNDING,
      ),
  );

  const source: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const destination: IAutoMovieQuaternion = {
    x: 0,
    y: 0,
    z: -Math.sqrt(3) / 2,
    w: -0.5,
  };
  const along: (progress: number) => IAutoMovieQuaternion =
    AutoMovieEngineQuaternion.prepareSlerp(source, destination);
  source.x = 1;
  source.w = 0;
  destination.z = 0;
  destination.w = -1;
  const middle: IAutoMovieQuaternion = along(0.5);
  TestValidator.predicate(
    "the original midpoint is a 60-degree rotation about +Z",
    qclose(
      middle,
      { x: 0, y: 0, z: 0.5, w: Math.sqrt(3) / 2 },
      ROTATION_ROUNDING,
    ),
  );
  middle.z = 0;
  TestValidator.predicate(
    "a reordered read is fresh and follows the original shorter arc",
    qclose(
      along(0.25),
      { x: 0, y: 0, z: Math.sin(Math.PI / 12), w: Math.cos(Math.PI / 12) },
      ROTATION_ROUNDING,
    ) &&
      qclose(
        along(0.5),
        { x: 0, y: 0, z: 0.5, w: Math.sqrt(3) / 2 },
        ROTATION_ROUNDING,
      ),
  );
}
