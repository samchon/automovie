import { AutoMovieArchetypeCourse as course } from "@automovie/archetypes";
import { AutoMovieGravity } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { qclose } from "../../../internal/qclose";

/**
 * At most eight rounded operations include the half-angle and radian
 * conversion.
 */
const ANGLE_ROUNDING: number = 16 * Number.EPSILON;

/**
 * The single-track lean balances the turn against gravity in the travel frame.
 *
 * Scenarios:
 *
 * 1. At two metres per second and curvature g/4, the lateral acceleration equals
 *    gravity. The forward lean is 45 degrees, the reverse lean is −45, and a
 *    straight path has no lean.
 * 2. A 90-degree bank under a 90-degree yaw multiplies the two half-angle
 *    quaternions in vehicle order while keeping the original location.
 */
export function test_unit_archetypes_internal_course_lean(): void {
  const state: course.IState = {
    distance: 0,
    speed: 2,
    progress: 0,
    curvature: AutoMovieGravity.STANDARD / 4,
    reverse: false,
    placement: {
      translation: { x: 2, y: 3, z: 4 },
      rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
      scale: { x: 1, y: 1, z: 1 },
    },
  };
  TestValidator.predicate(
    "forward balance angle",
    nclose(course.lean(state), 45, 45 * ANGLE_ROUNDING),
  );
  TestValidator.predicate(
    "reversing flips the balance",
    nclose(course.lean({ ...state, reverse: true }), -45, 45 * ANGLE_ROUNDING),
  );
  TestValidator.equals(
    "straight course",
    course.lean({ ...state, curvature: 0 }),
    0,
  );
  const bank: typeof state.placement = course.banked(state, 90);
  TestValidator.predicate(
    "local bank under yaw",
    qclose(
      bank.rotation,
      { x: -1 / 2, y: 1 / 2, z: -1 / 2, w: 1 / 2 },
      ANGLE_ROUNDING,
    ),
  );
  TestValidator.equals(
    "bank holds the track point",
    bank.translation,
    state.placement.translation,
  );
  TestValidator.equals("bank is rigid", bank.scale, { x: 1, y: 1, z: 1 });
}
