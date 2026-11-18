import type {
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanFoot } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { vclose } from "../internal/vclose";

/**
 * Heel-off transfers the foot’s pivot to its forefoot while that contact stays fixed.
 *
 * Scenarios:
 * 1. Rotate a foot in pitch around the ball of the sole and compare the heel and support point with a flat pose.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Heel-off transfers the foot’s pivot to its forefoot while that contact stays fixed.
 * @evidence contracts/development/testing.md#independent-expectations A rigid rotation about the front support moves the heel along a circular arc.
 * @evidence contracts/development/testing.md#distinguishing-cases Flat contact has a low heel; pitched contact preserves the support point with the heel raised.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_support_transfer(): void {
  const body = motionHumanBody("m-average");
  const anchor: IAutoMovieVector3 = { x: 1, y: 0, z: 2 };
  const flat: IAutoMovieMotionHumanFoot.IPlacement = HumanFoot.pivot(
    body,
    "left",
    "ball",
    anchor,
    0,
    0,
  );
  const rocked: IAutoMovieMotionHumanFoot.IPlacement = HumanFoot.pivot(
    body,
    "left",
    "ball",
    anchor,
    0,
    -20,
  );
  const heel = (
    foot: IAutoMovieMotionHumanFoot.IPlacement,
  ): IAutoMovieVector3 => HumanFoot.point(body, "left", "heel", foot);
  TestValidator.predicate(
    "fixed forefoot",
    vclose(HumanFoot.point(body, "left", "ball", rocked), anchor),
  );
  const before = heel(flat),
    after = heel(rocked);
  TestValidator.predicate("heel leaves the bearing plane", after.y > before.y);
  TestValidator.predicate(
    "rigid heel radius",
    Math.abs(
      Math.hypot(before.y - anchor.y, before.z - anchor.z) -
        Math.hypot(after.y - anchor.y, after.z - anchor.z),
    ) < 1e-8,
  );
}
