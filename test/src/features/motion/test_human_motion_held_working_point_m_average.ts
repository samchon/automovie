import { TestValidator } from "@nestia/e2e";

import { motionHeldWorkingPoint } from "../internal/motionHeldWorkingPoint";

/**
 * A swing of a held implement meets its target with the implement's own
 * working point, read from its affordance, never with a share of its length:
 * a racket's `sweetSpot`. Before, a racket's swing landed the point 0.3 of
 * the racket's length behind its sweet spot on the target, about 115 mm.
 *
 * The bound is the motion campaign's: a contact lies within 15 mm of its
 * target at its event.
 *
 * Scenarios, on the average man, read by `motionHeldWorkingPoint` (the small woman has
 * its own spec). A tennis racket lies level before the right hand and is
 * taken by its grip, then swung with `tip: "sweetSpot"` at a point of the
 * world before the body:
 * 1. A forehand: the `sweetSpot` is within 15 mm of the target at the
 *    swing's decisive instant.
 * 2. An overhead smash: the `sweetSpot` is within 15 mm of the target at the
 *    swing's decisive instant.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds performances through the public chain, props and input and reads the displayed implement's own affordance; a swing that lands another part of the racket on the target fails with the distance.
 * @evidence contracts/development/testing.md#independent-expectations The working point is the archetype's declared affordance, placed in the world by the displayed prop frame; the bound is the campaign's contact bound.
 * @evidence contracts/development/testing.md#distinguishing-cases Two lines of swing, on two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds two films, under a minute alone; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the defect it replaces, the bound and the 2 scenarios.
 */
export function test_human_motion_held_working_point_m_average(): void {
  TestValidator.equals(
    "a held implement meets its target with its working point",
    motionHeldWorkingPoint("m-average"),
    [],
  );
}
