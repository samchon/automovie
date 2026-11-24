import type { IAutoMovieVector3 } from "@automovie/interface";
import { staggerSwingBow } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** A rectangle on the floor, its x and z ranges. */
const rectangle = (
  x: readonly [number, number],
  z: readonly [number, number],
): IAutoMovieVector3[] => [
  { x: x[0], y: 0, z: z[0] },
  { x: x[1], y: 0, z: z[0] },
  { x: x[1], y: 0, z: z[1] },
  { x: x[0], y: 0, z: z[1] },
];

/** The standing sole, a unit square. */
const STANDING: IAutoMovieVector3[] = rectangle([0, 1], [0, 1]);

/** The bow's normal, +X; the swing runs along −Z. */
const NORMAL: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };

/**
 * A stagger's swing bow: `staggerSwingBow.need` is the least bow on each side
 * carrying the swinging outline past the standing one at a swing share, over
 * the bow's profile `16 u² (1 − u)²`, and `choose` takes the side needing the
 * smaller, capped, or none where a side already clears.
 *
 * Scenarios, the standing sole the unit square and the swinging sole spanning x
 * 0.8 to 1.3:
 *
 * 1. Alongside (z 0.2 to 0.6) at mid-swing, the profile one: the positive side
 *    needs 1 − 0.8 = 0.2 and the negative 1.3 − 0 = 1.3.
 * 2. At a quarter share the profile is 16 · 1/16 · 9/16 = 9/16, so each need is
 *    its mid-swing one over 9/16.
 * 3. Not alongside (z 2 to 3), neither side needs a bow.
 * 4. At the swing's start, no bow profile, an outline not yet clear needs an
 *    infinite bow on each side.
 * 5. The positive side's 0.2 is taken; capped at 0.1 it is 0.1; a smaller negative
 *    need is taken negated; a side already clear takes none.
 */
export function test_unit_motions_reaction_stagger_swing_bow(): void {
  const alongside: IAutoMovieVector3[] = rectangle([0.8, 1.3], [0.2, 0.6]);
  const [plus, minus]: readonly [number, number] = staggerSwingBow.need(
    STANDING,
    alongside,
    NORMAL,
    0.5,
  );
  TestValidator.predicate(
    "the needs at mid-swing",
    nclose(plus, 0.2, 1e-12) && nclose(minus, 1.3, 1e-12),
  );
  const [qPlus, qMinus]: readonly [number, number] = staggerSwingBow.need(
    STANDING,
    alongside,
    NORMAL,
    0.25,
  );
  TestValidator.predicate(
    "the needs at a quarter share",
    nclose(qPlus, 0.2 / (9 / 16), 1e-12) &&
      nclose(qMinus, 1.3 / (9 / 16), 1e-12),
  );
  TestValidator.equals(
    "not alongside",
    staggerSwingBow.need(STANDING, rectangle([0.8, 1.3], [2, 3]), NORMAL, 0.5),
    [-Infinity, -Infinity],
  );
  TestValidator.equals(
    "no profile at the start",
    staggerSwingBow.need(STANDING, alongside, NORMAL, 0),
    [Infinity, Infinity],
  );
  TestValidator.predicate(
    "the side chosen",
    staggerSwingBow.choose(0.2, 1.3, 0.5) === 0.2 &&
      staggerSwingBow.choose(0.2, 1.3, 0.1) === 0.1 &&
      staggerSwingBow.choose(0.4, 0.3, 0.5) === -0.3 &&
      staggerSwingBow.choose(-Infinity, 1.3, 0.5) === 0,
  );
}
