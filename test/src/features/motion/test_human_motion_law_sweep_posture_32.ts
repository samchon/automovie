import { TestValidator } from "@nestia/e2e";

import { MOTION_HUMAN_LAW_STAGES_POSTURE } from "../internal/MOTION_HUMAN_LAW_STAGES_POSTURE";
import { motionHumanLawCovering } from "../internal/motionHumanLawCovering";

/**
 * Every combination of every posture law moves a real body as a body can
 * move: looking, gesturing, resting the hands, bracing, bending, crouching, kneeling, lying down, moving across supports, getting up from the floor, sitting, shifting, rising and typing.
 *
 * Each law is staged over a covering array of its parameters (each value
 * and the parameter left out), the two extreme bodies (f-small, m-large)
 * and one seed: every pair of values of any two factors meets in some
 * cell, which covers the interactions that trigger most faults (Kuhn,
 * Kacker and Lei 2010, NIST SP 800-142) at a small share of the Cartesian
 * product; the bodies between and seeded variation are the variation
 * specs' own
 * (`motionHumanLawCovering`). Each cell is performed and read off the
 * displayed bones; the complaints of every cell are gathered before the one
 * assertion, so a failing cell does not hide the others, and each names its
 * law, settings, bodies, seed, person, check, measured value, limit and
 * instant. The mirror image of a side is checked by the metamorphic mirror
 * specs.
 *
 * This is part 32 of 62 of the sweep (`motionHumanLawCovering.part`): the cells whose performer is m-large, those whose position among that body's cells leaves 0 when divided by 31, so each part prepares two bodies and stays under a minute; the 62 parts together are the whole covering array. Written by `pnpm --filter @automovie/test sweep:parts`.
 *
 * Scenarios, per cell:
 * 1. The film plans without refusal and every declared window and event is
 *    well formed.
 * 2. No segment enters another, or the partner, deeper than 10 mm.
 * 3. Nothing sinks under the floor; a planted foot neither slips nor lifts;
 *    a foot shown on the floor does not skate and a declared plant is
 *    neither loose nor afloat; and where the action asks for balance or
 *    stages a physical outcome (`HumanPhysics.judged`), the mass stays over
 *    its support.
 * 4. No joint centre jumps, reverses or outruns a joint between frames, no
 *    bone spins through a turn, and every joint stays in its range.
 * 5. The same seed gives the same film, on each law's first cell.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs each real law through the chain and reads displayed bones and colliders; a refusal, a penetration, a slipped foot, a jump or a joint out of range fails with its cell and number.
 * @evidence contracts/development/testing.md#independent-expectations Every bound is the audit's own physical limit or the body's symmetry; none is read from a law's output.
 * @evidence contracts/development/testing.md#distinguishing-cases A covering array per law of the family: every pair of parameter values and the two extreme bodies, on one seed.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and performs this part's cells in memory, under a minute alone; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the covering design, the part's share of it, how the complaints are gathered and the 5 scenarios with their bounds.
 */
export function test_human_motion_law_sweep_posture_32(): void {
  TestValidator.equals(
    "every posture cell of part 32 of 62 is clean",
    motionHumanLawCovering.part(MOTION_HUMAN_LAW_STAGES_POSTURE, [31, 62]),
    [],
  );
}
