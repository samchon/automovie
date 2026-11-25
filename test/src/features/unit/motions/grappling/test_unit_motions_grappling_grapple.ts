import { HumanRefusal, grappleArms, grappleFront, grappleStances, grappleSumo } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** A body's heights, depth and head radius, metres. */
const MEASURE: Parameters<typeof grappleFront.chest>[0]["measure"] &
  Parameters<typeof grappleFront.head>[0]["measure"] = {
  hipHeight: 0.9,
  chestHeight: 1.3,
  chestDepth: 0.24,
  headHeight: 1.6,
  headRadius: 0.1,
};

/** A duration refusal of the arms' plan asking a least duration. */
const short = (minimum: number): HumanRefusal =>
  new HumanRefusal({
    kind: "parameter",
    axis: "duration",
    value: 4,
    feasible: { kind: "range", minimum, maximum: 10, unit: "s" },
    reason: "too short",
    fix: "lengthen it",
  });

/**
 * The grapple law's own staging: each kind's grips and scene length, the sumo
 * bouts' phase window, the front of a leaning body, and the stretched rest a
 * too-short scene asks.
 *
 * Scenarios:
 *
 * 1. A right-handed shoulder throw takes the left side of the neck and the right
 *    elbow; a right single leg the left front thigh with the right hand only.
 * 2. A shoulder throw lasts 3.5 s; a yori-kiri bout 5 s from the sumo table.
 * 3. Oshi-dashi is a sumo bout and a shoulder throw is not; a bout crouches to 22
 *    %, meets at 32 %, finishes just before 82 % and rests from 92 %.
 * 4. Leaning 30 degrees from the hips, the chest's front stands half its 0.4 m
 *    height above them plus half its depth ahead; leaning 90, the head's front
 *    stands its centre's 0.6 m height plus its radius ahead.
 * 5. A 4 s scene releasing at 3 s and resting at 3.6 s, refused for asking 5 s,
 *    rests at `3 + 0.6 · 5 / 4` = 3.75 s; asking 8 s it would end past the
 *    scene: none.
 */
export function test_unit_motions_grappling_grapple(): void {
  TestValidator.equals(
    "the grips and the lengths",
    [
      grappleStances.regions("seoiNage", "right"),
      grappleStances.regions("singleLeg", "right"),
      grappleStances.seconds("seoiNage"),
      grappleStances.seconds("yoriKiri"),
    ],
    [
      { left: "elbowRight", right: "neckLeft" },
      { right: "thighFrontLeft" },
      3.5,
      5,
    ],
  );
  TestValidator.equals(
    "the sumo bouts",
    [
      grappleSumo.is("oshiDashi"),
      grappleSumo.is("seoiNage"),
      grappleSumo.window(),
    ],
    [
      true,
      false,
      { reach: 0.22, take: 0.32, release: 0.82 - 0.04, rest: 0.92 },
    ],
  );
  TestValidator.predicate(
    "the leaning fronts",
    nclose(grappleFront.chest({ measure: MEASURE }, 30), 0.2 + 0.12, 1e-12) &&
      nclose(grappleFront.head({ measure: MEASURE }, 90), 0.6 + 0.1, 1e-12),
  );
  TestValidator.equals(
    "the stretched rest, or none",
    [
      grappleArms.stretched(short(5), 4, 3, 3.6),
      grappleArms.stretched(short(8), 4, 3, 3.6),
    ],
    [3 + (0.6 * 5) / 4, undefined],
  );
}
