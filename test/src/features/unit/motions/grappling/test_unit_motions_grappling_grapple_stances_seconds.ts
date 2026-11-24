import { grappleStances } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `grappleStances.seconds` is a grapple's default scene length: the
 * vocabulary's stated seconds per kind, a sumo bout's from its own table.
 *
 * Scenarios:
 *
 * 1. A shoulder throw lasts 3.5 s, a foot sweep 3 s, a single-leg 3.8 s.
 * 2. A yori-kiri bout lasts 5 s, an oshi-dashi 4.5 s.
 */
export function test_unit_motions_grappling_grapple_stances_seconds(): void {
  TestValidator.equals(
    "each kind's length",
    [
      grappleStances.seconds("seoiNage"),
      grappleStances.seconds("deAshiHarai"),
      grappleStances.seconds("singleLeg"),
      grappleStances.seconds("yoriKiri"),
      grappleStances.seconds("oshiDashi"),
    ],
    [3.5, 3, 3.8, 5, 4.5],
  );
}
