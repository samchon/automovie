import { HumanKnot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * The holds of a knot curve split it into rest-to-rest pieces
 * (`HumanKnot.pieces`).
 *
 * Scenarios:
 *
 * 1. Five knots, dwells at the first, the third and the last: the interior hold at
 *    the third splits the movement into knots 0–2 and 2–4; the first and last
 *    holds split nothing.
 * 2. Without dwells, one piece over every knot.
 * 3. A single knot is a hold only, with no piece.
 */
export function test_unit_engine_geometry_geometry_knot_dwell(): void {
  const knot = (dwell: number): HumanKnot.IKnot => ({ position: [0], dwell });
  TestValidator.equals(
    "an interior hold splits the movement",
    HumanKnot.pieces([knot(0.3), knot(0), knot(0.5), knot(0), knot(0.2)]),
    [
      { first: 0, last: 2 },
      { first: 2, last: 4 },
    ],
  );
  TestValidator.equals(
    "no hold, one piece",
    HumanKnot.pieces([knot(0), knot(0), knot(0)]),
    [{ first: 0, last: 2 }],
  );
  TestValidator.equals("one knot, no piece", HumanKnot.pieces([knot(1)]), []);
}
