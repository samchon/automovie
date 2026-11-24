import { grappleStances } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `grappleStances.regions` names where each of the initiator's hands takes
 * the partner: a judo throw's collar and sleeve, a single leg's near thigh, a
 * double leg's two thighs, a Greco-Roman tie's shoulders, a sumo bout's own.
 *
 * Scenarios:
 *
 * 1. A right-handed shoulder throw takes the left side of the neck and the
 *    right elbow.
 * 2. A right single leg takes the left front thigh with the right hand only.
 * 3. A double leg takes both front thighs, crossed.
 * 4. A Greco-Roman throw takes both shoulders, crossed; an oshi-dashi both
 *    sides of the ribs.
 */
export function test_unit_motions_grappling_grapple_stances_regions(): void {
  TestValidator.equals(
    "each kind's grips",
    [
      grappleStances.regions("seoiNage", "right"),
      grappleStances.regions("singleLeg", "right"),
      grappleStances.regions("doubleLeg", "right"),
      grappleStances.regions("grecoRoman", "right"),
      grappleStances.regions("oshiDashi", "right"),
    ],
    [
      { left: "elbowRight", right: "neckLeft" },
      { right: "thighFrontLeft" },
      { left: "thighFrontRight", right: "thighFrontLeft" },
      { left: "shoulderRight", right: "shoulderLeft" },
      { left: "ribsRight", right: "ribsLeft" },
    ],
  );
}
