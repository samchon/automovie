import {
  AutoMovieMotionHumanTarget,
  AutoMovieMotionHumanTargetGrid,
  AutoMovieMotionHumanVariationPlace,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { MOTION_VARIATION_BODIES } from "../internal/MOTION_VARIATION_BODIES";
import { motionVariationSource } from "../internal/motionVariationSource";

/**
 * A varied place keeps its three names, on every body and for both hands.
 *
 * Each place is varied at full variation for a novice with a fast arrival
 * (0.6 m in 0.3 s, the widest spread a gesture gives), put in the world by
 * `fallback` on a performer at the origin facing +Z, and read back through
 * `nearest`, which does not run the resolver forward.
 *
 * Scenarios:
 * 1. All 160 places of the grid (10 heights, 4 laterals, 4 distances) on the
 *    three stub bodies, for the left and the right hand, over 128 repeats:
 *    every read gives the place's own three names.
 * 2. The places of `wave` (eye, outside, near) and of `stopPalm` (shoulder,
 *    inside, far) over 1,024 repeats on every body and hand: the same.
 * 3. A place on the floor never goes below the floor, and still varies
 *    sideways and forward.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public place slot on real seeded streams and reads the result through the inverse resolver; a bound read in the wrong unit, a lateral not mirrored by the hand, or an offset past a cell's edge fails.
 * @evidence contracts/development/testing.md#independent-expectations The expected names are the authored ones; `nearest` reads a world point against the body's measures and shares no code path with the cell rule.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers every name of every axis, the first and the last name of each, three body proportions, both hands and the floor.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on real streams and stubs of the measures read. The same check on the polygon men belongs to the gesture motion captures. It runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the travel, the path of the read and lists the 3 scenarios.
 */
export function test_motion_compose_variation_named(): void {
  const posture = { root: { x: 0, y: 0, z: 0 }, yaw: 0 };
  const travel: AutoMovieMotionHumanVariationPlace.ITravel = {
    distance: 0.6,
    seconds: 0.3,
  };
  const strays = (
    grid: AutoMovieMotionHumanTargetGrid.IGrid,
    count: number,
  ): string[] => {
    const out: string[] = [];
    for (const [b, body] of MOTION_VARIATION_BODIES.entries())
      for (const side of ["left", "right"] as const) {
        const record = AutoMovieMotionHumanTargetGrid.place(body, side, grid);
        for (let index: number = 0; index < count; ++index) {
          const read = AutoMovieMotionHumanTargetGrid.nearest(
            body,
            posture,
            side,
            AutoMovieMotionHumanTarget.fallback(
              body,
              posture,
              AutoMovieMotionHumanVariationPlace.vary(
                motionVariationSource({ index }),
                "place",
                body,
                side,
                record,
                travel,
              ),
            ).point,
          );
          if (
            read.height !== grid.height ||
            read.lateral !== grid.lateral ||
            read.distance !== grid.distance
          )
            out.push(
              `${grid.height}/${grid.lateral}/${grid.distance} body ${b} ${side} repeat ${index}: ${read.height}/${read.lateral}/${read.distance}`,
            );
        }
      }
    return out;
  };

  // 1. The whole grid.
  const grid: string[] = [];
  for (const height of AutoMovieMotionHumanTargetGrid.HEIGHTS)
    for (const lateral of Object.keys(
      AutoMovieMotionHumanTargetGrid.LATERALS,
    ) as AutoMovieMotionHumanTargetGrid.Lateral[])
      for (const distance of Object.keys(
        AutoMovieMotionHumanTargetGrid.DISTANCES,
      ) as AutoMovieMotionHumanTargetGrid.Distance[])
        grid.push(...strays({ height, lateral, distance }, 128));
  TestValidator.equals("every place of the grid keeps its names", grid, []);

  // 2. The first users.
  TestValidator.equals(
    "the wave and the stop palm keep their names",
    [
      ...strays({ height: "eye", lateral: "outside", distance: "near" }, 1024),
      ...strays(
        { height: "shoulder", lateral: "inside", distance: "far" },
        1024,
      ),
    ],
    [],
  );

  // 3. The floor.
  const body = MOTION_VARIATION_BODIES[0]!;
  const floor = Array.from({ length: 128 }, (_: unknown, index: number) =>
    AutoMovieMotionHumanVariationPlace.vary(
      motionVariationSource({ index }),
      "place",
      body,
      "left",
      AutoMovieMotionHumanTarget.DEFAULTS.floor,
      travel,
    ),
  );
  TestValidator.predicate(
    "a place on the floor stays on the floor and varies along it",
    floor.every((p): boolean => p.height === 0) &&
      floor.some((p): boolean => p.range !== 0.6) &&
      floor.some((p): boolean => p.lateral !== 0),
  );
}
