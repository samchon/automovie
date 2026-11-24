import type { AthleticsRunUp } from "@automovie/motions/internal";
import { highJumpBar } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/**
 * `highJumpBar.admit` requires the take-off foot to be the one farther from
 * the bar, as a Fosbury flop takes off from the outside foot of its curve.
 *
 * The bar lies along +X, 0.8 m ahead in +Z of an ankle at the origin; the
 * runner runs along +X, so the bar is on the runner's right (the left is -Z
 * for a heading of +X).
 *
 * Scenarios:
 *
 * 1. Taking off from the left foot, the farther one, is admitted.
 * 2. Taking off from the right foot, the nearer one, is refused.
 */
export function test_unit_motions_sport_high_jump_bar_admit(): void {
  const bar: highJumpBar.IBar = {
    point: { x: 0, y: 2, z: 0.8 },
    axis: { x: 1, y: 0, z: 0 },
    length: 4,
  };
  const approach = (foot: "left" | "right"): AthleticsRunUp.IApproach => ({
    foot,
    speed: 7,
    heading: { x: 1, y: 0, z: 0 },
    ankle: { x: 0, y: 0.08, z: 0 },
    stance: 0.15,
    toeOff: { x: 0.2, y: 0.05, z: 0 },
  });
  TestValidator.predicate(
    "the outside foot only",
    !throwsError(() => highJumpBar.admit(bar, approach("left"))) &&
      throwsError(() => highJumpBar.admit(bar, approach("right"))),
  );
}
