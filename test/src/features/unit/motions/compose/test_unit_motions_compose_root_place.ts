import type {
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanRoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** Rounding of one rotation and one sum per component, metres. */
const ROUNDING: number = 1e-12;

/**
 * `AutoMovieMotionHumanRoot.place` moves a posture's root by an offset given in
 * the posture's own floor frame, then turns its heading.
 *
 * The frame is the performer's: `x` left, `y` up, `z` forward, rotated about +Y
 * by the posture's yaw in degrees, so a right-handed quarter turn carries local
 * +Z onto world +X and local +X onto world -Z. The yaw adds.
 *
 * Scenarios:
 *
 * 1. At heading 0 the local offset is the world offset.
 * 2. At heading 90 local forward becomes world +X, local left world -Z and up
 *    stays up; the heading becomes 90 plus the turn.
 * 3. A zero offset returns the root and heading unchanged.
 * 4. The pitch, roll, joints and limbs pass through untouched.
 */
export function test_unit_motions_compose_root_place(): void {
  const posture: (yaw: number) => IAutoMovieMotionHumanPosture = (
    yaw: number,
  ): IAutoMovieMotionHumanPosture => ({
    root: { x: 2, y: 0.9, z: 3 },
    yaw,
    pitch: 4,
    roll: -2,
    joints: { leftLowerLeg: [10, 0, 0] },
    limbs: {},
  });
  const offset: IAutoMovieVector3 = { x: 0.3, y: 0.1, z: 0.5 };

  // 1. Heading 0: the frames agree.
  const straight: IAutoMovieMotionHumanPosture = AutoMovieMotionHumanRoot.place(
    posture(0),
    { point: offset, yaw: 15 },
  );
  TestValidator.predicate(
    "heading 0 moves by the offset itself",
    vclose(straight.root, { x: 2.3, y: 1, z: 3.5 }, ROUNDING) &&
      straight.yaw === 15,
  );

  // 2. Heading 90: forward to +X, left to -Z.
  const turned: IAutoMovieMotionHumanPosture = AutoMovieMotionHumanRoot.place(
    posture(90),
    { point: offset, yaw: 15 },
  );
  TestValidator.predicate(
    "heading 90 rotates the offset a quarter turn about +Y",
    vclose(turned.root, { x: 2 + 0.5, y: 1, z: 3 - 0.3 }, ROUNDING) &&
      nclose(turned.yaw, 105, ROUNDING),
  );

  // 3. A zero offset.
  const still: IAutoMovieMotionHumanPosture = AutoMovieMotionHumanRoot.place(
    posture(90),
    { point: { x: 0, y: 0, z: 0 }, yaw: 0 },
  );
  TestValidator.predicate(
    "a zero offset keeps the root and heading",
    vclose(still.root, posture(90).root, ROUNDING) && still.yaw === 90,
  );

  // 4. Every other channel passes through.
  TestValidator.equals(
    "pitch, roll, joints and limbs are untouched",
    [turned.pitch, turned.roll, turned.joints, turned.limbs],
    [4, -2, { leftLowerLeg: [10, 0, 0] }, {}],
  );
}
