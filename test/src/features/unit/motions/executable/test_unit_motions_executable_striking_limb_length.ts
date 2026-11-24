import type { IAutoMovieBodyMeasure } from "@automovie/interface";
import { StrikingLimb } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixture } from "../../../internal/fixtures/humanFixture";
import { nclose } from "../../../internal/nclose";

/**
 * `StrikingLimb.length` bounds a bare limb's reach from its root joint by the
 * body's own segments: the upper arm, the forearm and the hand for a punch, the
 * thigh, the shank and the foot for a kick, and the thigh and its radius for a
 * knee.
 *
 * Scenarios:
 *
 * 1. The average man's hand reaches his arm's three segments.
 * 2. His foot reaches his leg's three segments.
 * 3. His knee reaches his thigh and its radius, whichever foot strikes.
 */
export async function test_unit_motions_executable_striking_limb_length(): Promise<void> {
  const m: IAutoMovieBodyMeasure = (await humanFixture("m-average")).measure;
  const body: { measure: IAutoMovieBodyMeasure } = { measure: m };
  TestValidator.predicate(
    "the bare limbs' lengths",
    nclose(
      StrikingLimb.length(body, "rightHand", false),
      m.upperArm + m.forearm + m.hand,
      1e-12,
    ) &&
      nclose(
        StrikingLimb.length(body, "leftFoot", false),
        m.thigh + m.shank + m.footLength,
        1e-12,
      ) &&
      nclose(
        StrikingLimb.length(body, "rightFoot", true),
        m.thigh + m.thighRadius,
        1e-12,
      ),
  );
}
