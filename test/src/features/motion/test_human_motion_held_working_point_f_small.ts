import { TestValidator } from "@nestia/e2e";

import { motionHeldWorkingPoint } from "../internal/motionHeldWorkingPoint";

/**
 * A swing of a held implement meets its target with the implement's own
 * working point, read from its affordance, never with a share of its length:
 * a racket's `sweetSpot`, a bat's `strike`. Before, a racket's swing landed
 * the point 0.3 of the racket's length behind its sweet spot on the target,
 * about 115 mm.
 *
 * The bound is the motion campaign's: a contact lies within 15 mm of its
 * target at its event.
 *
 * Scenarios, on the small woman, read by `motionHeldWorkingPoint` (the average man
 * has its own spec). Each implement lies level before the right hand and is
 * taken by its grip, then swung at a point at its own reach: ahead of the
 * right shoulder by half the arm and then the implement from its grip to its
 * working point:
 * 1. A tennis racket's forehand, `tip: "sweetSpot"`: the `sweetSpot` is
 *    within 15 mm of the target at the swing's decisive instant.
 * 2. Its overhead smash: the same.
 * 3. A bat's level swing, `clubSwing`, which fixes the `strike` contact: the
 *    `strike` is within 15 mm of the target at the decisive instant. A
 *    refusal of a target at the bat's own reach fails with its reason.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds performances through the public chain, props and input and reads the displayed implement's own affordance; a swing that lands another part of the implement on the target, or is refused, fails with the distance or the reason.
 * @evidence contracts/development/testing.md#independent-expectations The working point is the archetype's declared affordance, placed in the world by the displayed prop frame; each target is placed by the implement's own length; the bound is the campaign's contact bound.
 * @evidence contracts/development/testing.md#distinguishing-cases Two implements whose working points lie at different places along them, two lines of the racket's swing, on two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds three films, under a minute alone; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the defect it replaces, the bound and the 3 scenarios.
 */
export function test_human_motion_held_working_point_f_small(): void {
  TestValidator.equals(
    "a held implement meets its target with its working point",
    motionHeldWorkingPoint("f-small"),
    [],
  );
}
