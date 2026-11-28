import type {
  IAutoMovieMotionHumanFrame,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanFrame
} from "../../../../../packages/motions/src/posture/internal/HumanFrame";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** Rounding of one rotation about +Y and one sum, metres or degrees. */
const ROUNDING: number = 1e-12;

/**
 * `HumanFrame` converts between a performer's floor frame and the world: `x`
 * left, `y` up, `z` forward, turned about +Y by the heading in degrees and
 * moved to the origin. A quarter turn carries local +Z onto world +X and local
 * +X onto world −Z.
 *
 * Scenarios:
 *
 * 1. At heading 90 from (1, 0, 2), local (0.3, 0.1, 0.5) is world (1.5, 0.1, 1.7);
 *    `local` takes it back.
 * 2. `forward` is (sin yaw, 0, cos yaw): at 90, +X.
 * 3. `heading` reads a turn's yaw back: `turn(30)` reads 30.
 * 4. A prepared frame converts as point does and accepts a different origin when
 *    given one: local (0, 0, 2) about (0, 0, 1) at a quarter turn is (2, 0,
 *    1).
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines forward and inverse performer-floor transforms from degrees of yaw and world origin.
 * @evidence contracts/development/testing.md#behavioral-verification Tests local-to-world and inverse reads, derives heading from a rotation and compares a prepared transform at two origins.
 * @evidence contracts/development/testing.md#independent-expectations A quarter turn sends +Z to +X and +X to −Z. Applying that rotation and translation to (0.3, 0.1, 0.5) gives (1.5, 0.1, 1.7).
 */
export function test_motions_posture_frame(): void {
  const frame: IAutoMovieMotionHumanFrame = {
    origin: { x: 1, y: 0, z: 2 },
    yaw: 90,
  };
  const local: IAutoMovieVector3 = { x: 0.3, y: 0.1, z: 0.5 };
  const world: IAutoMovieVector3 = HumanFrame.point(frame, local);

  // 1. There and back.
  TestValidator.predicate(
    "a quarter turn and back",
    vclose(world, { x: 1.5, y: 0.1, z: 1.7 }, ROUNDING) &&
      vclose(HumanFrame.local(frame, world), local, ROUNDING),
  );

  // 2. Forward.
  TestValidator.predicate(
    "forward at a quarter turn is +X",
    vclose(HumanFrame.forward(90), { x: 1, y: 0, z: 0 }, ROUNDING),
  );

  // 3. A heading read back.
  TestValidator.predicate(
    "a turn's heading",
    nclose(HumanFrame.heading(HumanFrame.turn(30)), 30, 1e-9),
  );

  // 4. Prepared.
  TestValidator.predicate(
    "a prepared frame converts the same",
    vclose(HumanFrame.prepare(frame).point(local), world, ROUNDING) &&
      vclose(
        HumanFrame.prepare(frame).point(
          { x: 0, y: 0, z: 2 },
          { x: 0, y: 0, z: 1 },
        ),
        { x: 2, y: 0, z: 1 },
        ROUNDING,
      ),
  );
}
