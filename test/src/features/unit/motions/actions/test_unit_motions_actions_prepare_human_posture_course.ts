import type {
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
} from "@automovie/interface";
import { prepareHumanPostureCourse } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** Rounding of one quintic's evaluation, in each coordinate's units. */
const ROUNDING: number = 1e-12;

/**
 * The minimum-jerk share at a quarter of a rest-to-rest movement, `10 u^3 - 15
 * u^4 + 6 u^5` at `u = 1/4` (Flash and Hogan 1985).
 */
const QUARTER: number = 10 / 64 - 15 / 256 + 6 / 1024;

/**
 * `prepareHumanPostureCourse` joins key postures solved in preparation by a
 * minimum-jerk course through them: two knots make one rest-to-rest quintic,
 * so each continuous field at a second is `a + (b - a) s(u)` with `s` the
 * minimum-jerk share, and every other field is the last knot's at or before it.
 *
 * Scenarios:
 *
 * 1. Before the first knot the posture is the first's, after the last the
 *    last's.
 * 2. At the middle second the root, a joint and a joint only the second knot
 *    sets (zero in the first) are half way.
 * 3. At a quarter of the span they are at the minimum-jerk share `s(1/4)`.
 * 4. A heading from 350 to 10 degrees turns the short way, through 360.
 * 5. A foot rotation given as `q` and `-q` stays the same rotation, normalized.
 * 6. A goal's flag and a limb only the first knot sets come from the knot at or
 *    before the second.
 */
export function test_unit_motions_actions_prepare_human_posture_course(): void {
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const negated: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: -1 };
  const first: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 1, z: 0 },
    yaw: 350,
    pitch: 0,
    roll: 0,
    joints: { hips: [0, 0, 0] },
    limbs: {
      leftLeg: {
        point: { x: 0, y: 0, z: 0 },
        bend: { x: 0, y: 0.5, z: 1 },
        rotation: identity,
        planted: true,
      },
      rightArm: { point: { x: 1, y: 1, z: 1 }, bend: { x: 1, y: 1, z: 2 } },
    },
  };
  const last: IAutoMovieMotionHumanPosture = {
    root: { x: 2, y: 1, z: 0 },
    yaw: 10,
    pitch: 0,
    roll: 0,
    joints: { hips: [10, 0, 0], chest: [4, 0, 0] },
    limbs: {
      leftLeg: {
        point: { x: 2, y: 0, z: 0 },
        bend: { x: 2, y: 0.5, z: 1 },
        rotation: negated,
        planted: false,
      },
    },
  };
  const at: (seconds: number) => IAutoMovieMotionHumanPosture =
    prepareHumanPostureCourse([
      { seconds: 0, posture: first },
      { seconds: 2, posture: last },
    ]);

  // 1. Held outside the knots.
  TestValidator.predicate(
    "before the first knot",
    vclose(at(-1).root, first.root, ROUNDING),
  );
  TestValidator.predicate(
    "after the last knot",
    vclose(at(3).root, last.root, ROUNDING),
  );

  // 2. Half way at the middle second.
  const middle: IAutoMovieMotionHumanPosture = at(1);
  TestValidator.predicate(
    "the root half way",
    vclose(middle.root, { x: 1, y: 1, z: 0 }, ROUNDING),
  );
  TestValidator.predicate(
    "the hips half way",
    nclose(middle.joints.hips![0], 5, ROUNDING),
  );
  TestValidator.predicate(
    "a joint the first knot leaves out half way from zero",
    nclose(middle.joints.chest![0], 2, ROUNDING),
  );

  // 3. The minimum-jerk share at a quarter.
  TestValidator.predicate(
    "the root at s(1/4)",
    nclose(at(0.5).root.x, 2 * QUARTER, ROUNDING),
  );

  // 4. The short way round.
  TestValidator.predicate(
    "the heading through 360",
    nclose(middle.yaw, 360, ROUNDING),
  );

  // 5. One rotation however signed.
  const rotation: IAutoMovieQuaternion = middle.limbs.leftLeg!.rotation!;
  TestValidator.predicate(
    "the foot rotation stays the identity",
    nclose(Math.abs(rotation.w), 1, ROUNDING) &&
      nclose(rotation.x, 0, ROUNDING) &&
      nclose(rotation.y, 0, ROUNDING) &&
      nclose(rotation.z, 0, ROUNDING),
  );

  // 6. The discrete fields.
  TestValidator.equals(
    "the flag of the knot before",
    middle.limbs.leftLeg!.planted,
    true,
  );
  TestValidator.equals(
    "the flag of the last knot",
    at(2).limbs.leftLeg!.planted,
    false,
  );
  TestValidator.predicate(
    "a limb only the first knot sets",
    middle.limbs.rightArm !== undefined && at(2).limbs.rightArm === undefined,
  );
}
