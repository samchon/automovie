import {
  perturb
} from "../../../../../packages/motions/src/reaction/internal/perturb";
import {
  staggerBounds
} from "../../../../../packages/motions/src/reaction/internal/staggerBounds";
import { TestValidator } from "@nestia/e2e";

/**
 * Check which recovery step duration a push selects relative to the body
 * heading.
 *
 * Scenarios:
 *
 * 1. At heading zero, pushes along +Z, -Z and +X select forward, backward and
 *    sideways step times respectively.
 * 2. At heading 90 degrees, +X selects the forward clock. A zero push selects
 *    it at heading zero.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios identify the push directions and the heading used to classify them.
 * @evidence contracts/development/testing.md#behavioral-verification The test exercises forward, backward, sideways and zero-push choices, including a turned root.
 * @evidence contracts/development/testing.md#independent-expectations World-axis alignment gives each expected direction independently, and the public step-time table supplies the corresponding durations.
 */
export function test_motions_reaction_perturb(): void {
  TestValidator.equals(
    "the step for the push",
    [
      perturb.stepTime({ x: 0, y: 0, z: 30 }, 0),
      perturb.stepTime({ x: 0, y: 0, z: -30 }, 0),
      perturb.stepTime({ x: 30, y: 0, z: 0 }, 0),
      perturb.stepTime({ x: 30, y: 0, z: 0 }, 90),
      perturb.stepTime({ x: 0, y: 0, z: 0 }, 0),
    ],
    [
      staggerBounds.STEP_TIME.forward,
      staggerBounds.STEP_TIME.backward,
      staggerBounds.STEP_TIME.side,
      staggerBounds.STEP_TIME.forward,
      staggerBounds.STEP_TIME.forward,
    ],
  );
}
