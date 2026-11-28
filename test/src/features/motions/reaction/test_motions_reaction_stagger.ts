import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  staggerCaptureDistance
} from "../../../../../packages/motions/src/reaction/internal/staggerCaptureDistance";
import {
  staggerNearest
} from "../../../../../packages/motions/src/reaction/internal/staggerNearest";
import {
  staggerShift
} from "../../../../../packages/motions/src/reaction/internal/staggerShift";
import {
  staggerSwingBow
} from "../../../../../packages/motions/src/reaction/internal/staggerSwingBow";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** A unit square base of support on the floor. */
const SQUARE: readonly IAutoMovieVector3[] = [
  { x: 0, y: 0, z: 0 },
  { x: 1, y: 0, z: 0 },
  { x: 1, y: 0, z: 1 },
  { x: 0, y: 0, z: 1 },
];

/**
 * A stagger's balance helpers: `staggerShift` sums the series of residuals the
 * planted legs leave (a geometric series where the second residual is a share
 * of the first), and `staggerNearest` keeps a point inside the bearing feet's
 * outline, else moves it to the outline's nearest point.
 *
 * Scenarios:
 *
 * 1. A second residual a quarter of the first sums to the first over three
 *    quarters, on each level axis, with no height.
 * 2. A second residual of the opposite sign, or beyond the series' share, is added
 *    as it is.
 * 3. A point inside the square stays; one beyond its edge goes to the edge, beyond
 *    a corner to the corner; the prepared reader agrees.
 */
function scenario_test_motions_reaction_stagger_balance(): void {
  // 1. The series.
  TestValidator.predicate(
    "a quarter share sums geometrically",
    vclose(
      staggerShift({ x: 0.04, y: 1, z: -0.08 }, { x: 0.01, y: 1, z: -0.02 }),
      { x: 0.04 / 0.75, y: 0, z: -0.08 / 0.75 },
      1e-12,
    ),
  );

  // 2. Added as it is.
  TestValidator.predicate(
    "an opposite or large second residual is added",
    vclose(
      staggerShift({ x: 0.04, y: 0, z: 0.04 }, { x: -0.01, y: 0, z: 0.03 }),
      { x: 0.03, y: 0, z: 0.07 },
      1e-12,
    ),
  );

  // 3. The outline.
  const nearest: (point: IAutoMovieVector3) => IAutoMovieVector3 =
    staggerNearest.prepare(SQUARE);
  const inside: IAutoMovieVector3 = { x: 0.3, y: 0, z: 0.6 };
  TestValidator.predicate(
    "inside stays, outside goes to the edge or the corner",
    vclose(staggerNearest(SQUARE, inside), inside, 1e-12) &&
      vclose(
        staggerNearest(SQUARE, { x: 0.5, y: 0, z: -2 }),
        {
          x: 0.5,
          y: 0,
          z: 0,
        },
        1e-12,
      ) &&
      vclose(
        staggerNearest(SQUARE, { x: 3, y: 0, z: 3 }),
        {
          x: 1,
          y: 0,
          z: 1,
        },
        1e-12,
      ) &&
      vclose(nearest({ x: 3, y: 0, z: 3 }), { x: 1, y: 0, z: 1 }, 1e-12),
  );
}

/**
 * `staggerCaptureDistance` is Koolen's N-step capture distance in closed form:
 * `r` with no step, `r + (l − r + d_(N−1)) e^(-ω T_1)` for N steps, `d_n = r +
 * l q (1 − qⁿ) / (1 − q)` and `q = e^(-ω T_s)`.
 *
 * A pendulum at ω = 3 /s, a 0.1 m reach, 0.8 m steps of 0.3 s and a first step
 * of 0.5 s: `q = e^-0.9` and the first step's factor `e^-1.5`.
 *
 * Scenarios:
 *
 * 1. No step reaches the base's 0.1 m.
 * 2. One step adds `0.8 e^-1.5`, two add `(0.8 + 0.8 q) e^-1.5`.
 * 3. Many steps approach `0.1 + (0.8 + 0.8 q / (1 − q)) e^-1.5`, each adding less
 *    than the one before.
 */
function scenario_test_motions_reaction_stagger_capture_distance(): void {
  const d: (steps: number) => number = staggerCaptureDistance({
    w: 3,
    reach: 0.1,
    longest: 0.8,
    step: 0.3,
    first: 0.5,
  });
  const q: number = Math.exp(-0.9);
  const e: number = Math.exp(-1.5);
  TestValidator.predicate("no step", d(0) === 0.1);
  TestValidator.predicate(
    "one and two steps",
    nclose(d(1), 0.1 + 0.8 * e, 1e-12) &&
      nclose(d(2), 0.1 + (0.8 + 0.8 * q) * e, 1e-12),
  );
  TestValidator.predicate(
    "the limit",
    nclose(d(200), 0.1 + (0.8 + (0.8 * q) / (1 - q)) * e, 1e-12) &&
      d(3) - d(2) < d(2) - d(1),
  );
}

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
function scenario_test_motions_reaction_stagger_swing_bow(): void {
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

/**
 * Check stagger balance, capture distance and sole clearance during swing.
 *
 * Scenarios:
 *
 * 1. Compare the residual series and its additive fallbacks. Preserve an
 *    interior point and project exterior points to the nearest square edge or
 *    corner.
 * 2. Compare zero, one, two and many capture steps for a fixed pendulum. Each
 *    successive step contributes less.
 * 3. Calculate the swing bow at half and quarter progress. Check separated
 *    soles, zero bow profile, the smaller side and the cap.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios distinguish balance, step capture and foot clearance.
 * @evidence contracts/development/testing.md#behavioral-verification Three fixtures test residual accumulation, the support polygon, the capture model and the swing bow selector.
 * @evidence contracts/development/testing.md#independent-expectations The expectations use a geometric series, nearest points on a unit square, a closed-form pendulum series and the polynomial bow profile.
 */
export function test_motions_reaction_stagger(): void {
  scenario_test_motions_reaction_stagger_balance();
  scenario_test_motions_reaction_stagger_capture_distance();
  scenario_test_motions_reaction_stagger_swing_bow();
}
