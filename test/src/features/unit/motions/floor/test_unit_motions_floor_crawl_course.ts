import type {
  IAutoMovieMotionHumanCrawl,
  IAutoMovieVector3,
} from "@automovie/interface";
import { crawlCourse } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/** Rounding of one minimum-jerk share and one parabola, metres. */
const ROUNDING: number = 1e-12;

/** The minimum-jerk share at a quarter, `10/64 - 15/256 + 6/1024`. */
const QUARTER: number = 10 / 64 - 15 / 256 + 6 / 1024;

/**
 * `crawlCourse` carries each limb from print to print over its swing on the
 * minimum-jerk share of the swing's time (Flash and Hogan 1985), lifted on the
 * parabola `4 h p (1 - p)`, and holds it on its print between swings.
 *
 * The left hand here has prints 0.3 m apart along x, swings of 0.4 s lifting at
 * 1 and 2 s, and a 5 cm lift; the left knee lifts 2 cm.
 *
 * Scenarios:
 *
 * 1. Before its first swing a limb is on its entry print.
 * 2. Half way through a swing it is half way and at its full lift.
 * 3. A quarter through the second swing it is at `0.3 + 0.3 s(1/4)` and `4 h
 *    (1/4)(3/4)` high.
 * 4. At a touchdown and after the last swing it is on the print it reached.
 * 5. A knee lifts by the knee's height.
 */
export function test_unit_motions_floor_crawl_course(): void {
  const place: (
    limb: IAutoMovieMotionHumanCrawl.Limb,
    seconds: number,
  ) => IAutoMovieVector3 = crawlCourse({
    limbs: ["leftHand", "leftKnee"],
    cycles: 2,
    print: (
      _limb: IAutoMovieMotionHumanCrawl.Limb,
      k: number,
    ): IAutoMovieVector3 => ({
      x: 0.3 * k,
      y: 0,
      z: 0,
    }),
    lift: (_limb: IAutoMovieMotionHumanCrawl.Limb, k: number): number => k,
    swing: 0.4,
    handLift: 0.05,
    kneeLift: 0.02,
  });

  // 1. On the entry print.
  TestValidator.predicate(
    "before the first swing",
    vclose(place("leftHand", 0.5), { x: 0, y: 0, z: 0 }, ROUNDING),
  );

  // 2. Half way and fully lifted.
  TestValidator.predicate(
    "half way through a swing",
    vclose(place("leftHand", 1.2), { x: 0.15, y: 0.05, z: 0 }, ROUNDING),
  );

  // 3. A quarter through the second swing.
  TestValidator.predicate(
    "a quarter through the second swing",
    vclose(
      place("leftHand", 2.1),
      { x: 0.3 + 0.3 * QUARTER, y: 4 * 0.05 * 0.25 * 0.75, z: 0 },
      ROUNDING,
    ),
  );

  // 4. On the reached print.
  TestValidator.predicate(
    "at a touchdown",
    vclose(place("leftHand", 1.4), { x: 0.3, y: 0, z: 0 }, ROUNDING),
  );
  TestValidator.predicate(
    "after the last swing",
    vclose(place("leftHand", 5), { x: 0.6, y: 0, z: 0 }, ROUNDING),
  );

  // 5. The knee's own lift.
  TestValidator.predicate(
    "a knee's lift",
    vclose(place("leftKnee", 1.2), { x: 0.15, y: 0.02, z: 0 }, ROUNDING),
  );
}
