import { grappleSumo } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `grappleSumo` tells a sumo bout among the grapple kinds and gives its length,
 * its grips and its phase window: the shikiri crouch to 22%, the tachiai to
 * 32%, the finish just before 82% and the rest from 92%.
 *
 * Scenarios:
 *
 * 1. Oshi-dashi, yori-kiri and uwate-nage are bouts; a shoulder throw is not.
 * 2. They last 4.5, 5 and 4 s.
 * 3. Oshi-dashi pushes at the ribs; the belt bouts take the hips.
 * 4. The window's shares.
 */
export function test_unit_motions_grappling_grapple_sumo(): void {
  TestValidator.equals(
    "the bouts",
    [
      grappleSumo.is("oshiDashi"),
      grappleSumo.is("yoriKiri"),
      grappleSumo.is("uwateNage"),
      grappleSumo.is("seoiNage"),
    ],
    [true, true, true, false],
  );
  TestValidator.equals(
    "lengths, grips and window",
    [
      [
        grappleSumo.seconds("oshiDashi"),
        grappleSumo.seconds("yoriKiri"),
        grappleSumo.seconds("uwateNage"),
      ],
      grappleSumo.regions("oshiDashi"),
      grappleSumo.regions("uwateNage"),
      grappleSumo.window(),
    ],
    [
      [4.5, 5, 4],
      { left: "ribsRight", right: "ribsLeft" },
      { left: "hipRight", right: "hipLeft" },
      { reach: 0.22, take: 0.32, release: 0.82 - 0.04, rest: 0.92 },
    ],
  );
}
