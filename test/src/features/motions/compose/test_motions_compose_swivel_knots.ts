import type {
  AutoMovieHumanLimb,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";
import { courseLimbSwivelKnots } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of a quintic's evaluation, degrees. */
const ROUNDING: number = 1e-9;

/** A knot of one limb's seed, or none. */
function knot(
  seconds: number,
  seed?: IAutoMovieSwivelSeed,
  held?: readonly AutoMovieHumanLimb[],
): courseLimbSwivelKnots.ISwivelKnot {
  return {
    seconds,
    seeds: new Map<AutoMovieHumanLimb, IAutoMovieSwivelSeed>(
      seed === undefined ? [] : [["leftArm", seed]],
    ),
    ...(held === undefined ? {} : { held: new Set(held) }),
  };
}

/**
 * `courseLimbSwivelKnots` courses a limb's elbow swivel between the knots its
 * fits were solved at: `rates` lays the minimum-jerk path (Flash and Hogan
 * 1985) through each run of consecutive knots on one branch, at rest at the
 * run's ends, the swivel unwrapped step by step the short way and the forearm
 * twist a second coordinate only where every knot of the run gives one;
 * `between` reads a second between two knots on that path's quintic, keeps the
 * earlier seed where the branch changes, and takes the later one for a limb
 * whose goal begins inside the interval.
 *
 * Scenarios:
 *
 * 1. Knots at 0, 1 and 2 s with swivels 170, −170 and −150 on branch 0: unwrapped
 *    to 170, 190 and 210, at rest at both ends.
 * 2. A twist given at every knot is a second coordinate; one missing at a knot
 *    leaves the swivel alone.
 * 3. A branch change at the third knot ends the run: the second knot rests.
 * 4. Between two knots of a run at rest at both, the middle is the average.
 * 5. Across the branch change, the earlier seed; a limb whose goal starts inside
 *    the interval, the later one.
 */
export function test_motions_compose_swivel_knots(): void {
  // 1. Unwrapped and at rest.
  const knots: courseLimbSwivelKnots.ISwivelKnot[] = [
    knot(0, { swivel: 170, branch: 0, twist: 10 }),
    knot(1, { swivel: -170, branch: 0, twist: 20 }),
    knot(2, { swivel: -150, branch: 0, twist: 40 }),
  ];
  const rates: courseLimbSwivelKnots.Rates[] = courseLimbSwivelKnots.rates(
    knots,
    ["leftArm"],
  );
  TestValidator.predicate(
    "unwrapped the short way, at rest at the run's ends",
    rates
      .map(
        (r: courseLimbSwivelKnots.Rates): number =>
          r.get("leftArm")!.values[0]!,
      )
      .join() === "170,190,210" &&
      rates[0]!
        .get("leftArm")!
        .velocities.every((v: number): boolean => v === 0) &&
      rates[2]!
        .get("leftArm")!
        .velocities.every((v: number): boolean => v === 0) &&
      rates[1]!.get("leftArm")!.velocities[0]! > 0,
  );

  // 2. The twist coordinate.
  const untwisted: courseLimbSwivelKnots.Rates[] = courseLimbSwivelKnots.rates(
    [knots[0]!, knot(1, { swivel: -170, branch: 0 }), knots[2]!],
    ["leftArm"],
  );
  TestValidator.predicate(
    "a twist only where every knot gives one",
    rates[1]!.get("leftArm")!.values.length === 2 &&
      untwisted[1]!.get("leftArm")!.values.length === 1,
  );

  // 3. A branch change.
  const split: courseLimbSwivelKnots.ISwivelKnot[] = [
    knots[0]!,
    knots[1]!,
    knot(2, { swivel: -150, branch: 1 }),
  ];
  const parted: courseLimbSwivelKnots.Rates[] = courseLimbSwivelKnots.rates(
    split,
    ["leftArm"],
  );
  TestValidator.predicate(
    "a branch change ends the run",
    parted[1]!
      .get("leftArm")!
      .velocities.every((v: number): boolean => v === 0) &&
      parted[2]!.get("leftArm")!.values[0] === -150,
  );

  // 4. Between two knots at rest.
  const two: courseLimbSwivelKnots.ISwivelKnot[] = [
    knot(0, { swivel: 20, branch: 0 }),
    knot(2, { swivel: 60, branch: 0 }),
  ];
  const pair: courseLimbSwivelKnots.Rates[] = courseLimbSwivelKnots.rates(two, [
    "leftArm",
  ]);
  TestValidator.predicate(
    "the middle of a rest-to-rest piece is the average",
    nclose(
      courseLimbSwivelKnots
        .between(1, two[0]!, two[1]!, pair[0]!, pair[1]!)
        .get("leftArm")!.swivel,
      40,
      ROUNDING,
    ),
  );

  // 5. Branch change and a goal beginning inside.
  const across: ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed> =
    courseLimbSwivelKnots.between(
      1.5,
      split[1]!,
      split[2]!,
      parted[1]!,
      parted[2]!,
    );
  const begins: ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed> =
    courseLimbSwivelKnots.between(
      0.5,
      knot(0, undefined, []),
      knot(1, { swivel: 33, branch: 0 }),
      new Map(),
      new Map(),
    );
  TestValidator.predicate(
    "the earlier seed across a branch change, the later for a goal that begins",
    across.get("leftArm") === split[1]!.seeds.get("leftArm") &&
      begins.get("leftArm")!.swivel === 33,
  );
}
