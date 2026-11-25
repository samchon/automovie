import { HumanKnot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `HumanKnot.pieces` splits a curve's knots into rest-to-rest pieces at every
 * interior knot with a dwell; the first and the last knot's dwells split
 * nothing.
 *
 * Scenarios:
 *
 * 1. Five knots, the third with a dwell: pieces 0 to 2 and 2 to 4.
 * 2. Dwells on the first and the last knot only: one piece.
 * 3. Two knots make one piece and one knot none.
 */
export function test_motions_posture_knot_pieces(): void {
  const knot = (dwell: number): HumanKnot.IKnot => ({ position: [0], dwell });

  // 1. An interior hold.
  TestValidator.equals(
    "an interior hold splits the curve",
    HumanKnot.pieces([knot(0), knot(0), knot(1), knot(0), knot(2)]),
    [
      { first: 0, last: 2 },
      { first: 2, last: 4 },
    ],
  );

  // 2. End holds.
  TestValidator.equals(
    "end holds split nothing",
    HumanKnot.pieces([knot(1), knot(0), knot(3)]),
    [{ first: 0, last: 2 }],
  );

  // 3. Short curves.
  TestValidator.equals("two knots", HumanKnot.pieces([knot(0), knot(0)]), [
    { first: 0, last: 1 },
  ]);
  TestValidator.equals("one knot", HumanKnot.pieces([knot(0)]), []);
}
