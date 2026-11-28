import type {
  AutoMovieHumanLimb,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";
import {
  courseLimbSwivelKnots
} from "../../../../../packages/motions/src/compose/internal/courseLimbSwivelKnots";
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
 * 5. Before a branch change, keep the earlier seed. At the later knot, return
 *    its fitted branch or absence. A goal starting inside uses the later seed.
 * 6. A midpoint covered by both feasible arcs retains the earlier arc in
 *    its own winding. Excluding the midpoint from either arc drops the arc.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names short-angle unwrap, optional twist, branch breaks, rest endpoints, limb appearance and the shared feasible arc.
 * @evidence contracts/development/testing.md#behavioral-verification Calls courseLimbSwivelKnots rates and between on typed knot records and synthetic branches, and examines angles, velocities, seeds and feasible arcs.
 * @evidence contracts/development/testing.md#independent-expectations Unwrapping 170, -170 and -150 on one branch yields 170, 190 and 210. The symmetric rest-to-rest interval reaches 40 at midpoint, and 180 retains the earlier arc only if both authored intervals contain it.
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

  // 5. A branch change, the fitted end, and a goal beginning inside.
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
  const terminal: ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed> =
    courseLimbSwivelKnots.between(
      2,
      split[1]!,
      split[2]!,
      parted[1]!,
      parted[2]!,
    );
  const released: ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed> =
    courseLimbSwivelKnots.between(
      2,
      split[1]!,
      knot(2, undefined, []),
      parted[1]!,
      new Map(),
    );
  TestValidator.predicate(
    "retain the earlier branch until the fitted endpoint takes over",
    across.get("leftArm") === split[1]!.seeds.get("leftArm") &&
      terminal.get("leftArm")?.branch === 1 &&
      terminal.get("leftArm")?.swivel === -150 &&
      !released.has("leftArm") &&
      begins.get("leftArm")!.swivel === 33,
  );

  // 6. The rest-to-rest midpoint of the shortest 170 to -170 degree
  // turn is 180 degrees. Moving the two intervals up one turn makes
  // them [150, 200] and [175, 210], which both contain that midpoint.
  const mid = (
    earlier: NonNullable<IAutoMovieSwivelSeed["feasible"]>,
    later: NonNullable<IAutoMovieSwivelSeed["feasible"]>,
  ): IAutoMovieSwivelSeed | undefined => {
    const a: courseLimbSwivelKnots.ISwivelKnot = knot(0, {
      swivel: 170,
      branch: 0,
      feasible: earlier,
    });
    const b: courseLimbSwivelKnots.ISwivelKnot = knot(2, {
      swivel: -170,
      branch: 0,
      feasible: later,
    });
    const [p, q] = courseLimbSwivelKnots.rates([a, b], ["leftArm"]);
    return courseLimbSwivelKnots.between(1, a, b, p!, q!).get("leftArm");
  };
  const shared: IAutoMovieSwivelSeed | undefined = mid(
    { from: -210, to: -160 },
    { from: -185, to: -150 },
  );
  const outsideEarlier: IAutoMovieSwivelSeed | undefined = mid(
    { from: 150, to: 175 },
    { from: -185, to: -150 },
  );
  const outsideLater: IAutoMovieSwivelSeed | undefined = mid(
    { from: 150, to: 200 },
    { from: -175, to: -150 },
  );
  TestValidator.predicate(
    "retain the earlier feasible arc only while the midpoint is in both",
    shared !== undefined &&
      nclose(shared.swivel, 180, ROUNDING) &&
      shared.feasible?.from === 150 &&
      shared.feasible.to === 200 &&
      outsideEarlier !== undefined &&
      outsideEarlier.feasible === undefined &&
      outsideLater !== undefined &&
      outsideLater.feasible === undefined,
  );
}
