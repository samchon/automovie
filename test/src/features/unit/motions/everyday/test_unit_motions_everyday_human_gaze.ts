import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";
import { HumanGaze, blendGazeJoint } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

namespace part_blend_gaze_joint {
  /** Rounding of one product and sum per angle, degrees. */
  const ROUNDING: number = 1e-12;

  /**
   * `blendGazeJoint` moves one joint's three clinical angles from the record's
   * own, zero where it holds none, toward the gaze's asked angles by the
   * weight, writing the record in place.
   *
   * Scenarios:
   *
   * 1. A neck at (10, -4, 20) blended a quarter of the way toward (30, 4, -20) is
   *    at (15, -2, 10).
   * 2. A head the record leaves out blends from zero: half way toward (8, 6, -2)
   *    is (4, 3, -1).
   * 3. Weight 0 leaves the angles and 1 takes the asked ones.
   */
  export function verify(): void {
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      neck: [10, -4, 20],
    };
    const close = (
      angles: readonly [number, number, number] | undefined,
      expected: readonly [number, number, number],
    ): boolean =>
      angles !== undefined &&
      angles.every((v: number, i: number): boolean =>
        nclose(v, expected[i]!, ROUNDING),
      );

    // 1. A quarter of the way.
    blendGazeJoint(joints, "neck", 30, 4, -20, 0.25);
    TestValidator.predicate(
      "a quarter of the way",
      close(joints.neck, [15, -2, 10]),
    );

    // 2. From zero.
    blendGazeJoint(joints, "head", 8, 6, -2, 0.5);
    TestValidator.predicate("from zero", close(joints.head, [4, 3, -1]));

    // 3. The weight's ends.
    blendGazeJoint(joints, "head", 100, 100, 100, 0);
    TestValidator.predicate("weight 0", close(joints.head, [4, 3, -1]));
    blendGazeJoint(joints, "head", 8, 6, -2, 1);
    TestValidator.predicate("weight 1", close(joints.head, [8, 6, -2]));
  }
}

namespace part_human_gaze_split {
  /**
   * `HumanGaze.split` shares a gaze direction over the eyes, the head and the
   * trunk: the eyes take up to `EYES` (15 degrees, Freedman 2008), the head the
   * next up to its share (60 of yaw, 40 down, 30 up), the trunk what remains of
   * the yaw up to `TRUNK` (40), and the eyes whatever the others leave;
   * `recruit` keeps the trunk, or the head and the trunk, out. `saccade` times
   * the eyes by the main sequence (`2.2 A + 21` ms, Bahill et al. 1975) and
   * `turn` the head and trunk by `0.15 + 0.004 A` s.
   *
   * Scenarios:
   *
   * 1. A gaze 100 degrees left and 30 down: the head 60 left and 15 down, the
   *    trunk the last 25, the eyes 15 and 15.
   * 2. 150 degrees left: the trunk stops at 40, the eyes take 50.
   * 3. With the head only, 100 left leaves the eyes 40; with the eyes only, they
   *    take it all.
   * 4. 50 up: the head stops at 30 up, the eyes take 20.
   * 5. A 10-degree saccade takes 43 ms, a 50-degree head turn 0.35 s.
   */
  export function verify(): void {
    TestValidator.equals(
      "the splits",
      [
        HumanGaze.split(100, 30),
        HumanGaze.split(150, 0),
        HumanGaze.split(100, 0, "head"),
        HumanGaze.split(100, 0, "eyes"),
        HumanGaze.split(0, -50),
      ],
      [
        {
          eyes: { yaw: 15, pitch: 15 },
          head: { yaw: 60, pitch: 15 },
          trunk: 25,
        },
        { eyes: { yaw: 50, pitch: 0 }, head: { yaw: 60, pitch: 0 }, trunk: 40 },
        { eyes: { yaw: 40, pitch: 0 }, head: { yaw: 60, pitch: 0 }, trunk: 0 },
        { eyes: { yaw: 100, pitch: 0 }, head: { yaw: 0, pitch: 0 }, trunk: 0 },
        {
          eyes: { yaw: 0, pitch: -20 },
          head: { yaw: 0, pitch: -30 },
          trunk: 0,
        },
      ],
    );
    TestValidator.predicate(
      "the timings",
      Math.abs(HumanGaze.saccade(10) - 0.043) < 1e-12 &&
        Math.abs(HumanGaze.saccade(-10) - 0.043) < 1e-12 &&
        Math.abs(HumanGaze.turn(50) - 0.35) < 1e-12,
    );
  }
}

/**
 * `HumanGaze`'s unit contract: its split and joint blend.
 *
 * Its parts, each documented with its own scenarios:
 *
 * - `blend_gaze_joint`: `blendGazeJoint` moves one joint's three clinical angles
 *   from the record's own, zero where it holds none, toward the gaze's asked
 *   angles by the weight, writing the record in place.
 * - `human_gaze_split`: `HumanGaze.split` shares a gaze direction over the eyes,
 *   the head and the trunk:
 */
export async function test_unit_motions_everyday_human_gaze(): Promise<void> {
  part_blend_gaze_joint.verify();
  part_human_gaze_split.verify();
}
