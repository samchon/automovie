import { AutoMovieEngineSpace } from "@automovie/engine";
import type { IAutoMovieSpace, IAutoMovieSurface } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * Every axis projection and sample height in these axis-aligned fixtures is
 * dyadic.
 */
const GROUND_ROUNDING: number = 0;

/**
 * Ground height follows the top support across overlap and uses fallback
 * outside the footprint or where the top removes walkability.
 *
 * Scenarios:
 *
 * 1. A 1 m floor and a ramp climbing from 1 to 3 m over 4 m produce the analytic
 *    ramp midpoint height 2 m. The ramp wins where it rises above the floor.
 * 2. A higher nonwalkable panel and a point beyond all footprints both return
 *    the configured fallback.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the floor and ramp overlap, the ramp endpoints and midpoint, and the fallback for a covered no-go point or an uncovered point.
 * @evidence contracts/development/testing.md#behavioral-verification Creates the public `spaceGround` callback from a typed space and a fallback of -7 m, then queries seven XZ points without constructing a scene.
 * @evidence contracts/development/testing.md#independent-expectations The ramp rises 2 m in 4 m from X 0, so X 0.5, 2, and 4 yield 1.25, 2, and 3 m. The 9 m panel covers (2, 0.5) but leaves (2, 0) walkable. X 5 lies outside all footprints. All compared heights are exact dyadic values.
 */
export function test_engine_space_ground_height(): void {
  const rectangle = (
    left: number,
    right: number,
    front: number,
    back: number,
    y: number,
  ): IAutoMovieSurface["polygon"] => [
    { x: left, y, z: front },
    { x: right, y, z: front },
    { x: right, y, z: back },
    { x: left, y, z: back },
  ];
  const space: IAutoMovieSpace = {
    id: "ramp",
    walkable: ["deck", "slope"],
    surfaces: [
      {
        id: "deck",
        kind: "floor",
        polygon: rectangle(-3, 1, -1, 1, 1),
        anchor: { x: -1, y: 1, z: 0 },
        rampTo: null,
      },
      {
        id: "slope",
        kind: "ramp",
        polygon: rectangle(0, 4, -1, 1, 1),
        anchor: { x: 0, y: 1, z: 0 },
        rampTo: { x: 4, y: 3, z: 0 },
      },
      {
        id: "blocked",
        kind: "floor",
        polygon: rectangle(1.5, 2.5, 0.25, 0.75, 9),
        anchor: { x: 2, y: 9, z: 0.5 },
        rampTo: null,
      },
    ],
  };
  const ground: ReturnType<typeof AutoMovieEngineSpace.spaceGround> = AutoMovieEngineSpace.spaceGround(space, -7);
  const answers: [number, number, number][] = [
    [-1, 0, 1],
    [0, 0, 1],
    [0.5, 0, 1.25],
    [2, 0, 2],
    [4, 0, 3],
    [2, 0.5, -7],
    [5, 0, -7],
  ];
  TestValidator.predicate(
    "known support, overlap, ramp and fallback heights",
    answers.every(([x, z, expected]): boolean =>
      nclose(ground(x, z), expected, GROUND_ROUNDING),
    ),
  );
}
