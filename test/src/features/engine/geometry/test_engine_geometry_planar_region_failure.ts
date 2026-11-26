import { autoMoviePlanarRegionFailure } from "@automovie/engine";
import type { IAutoMoviePlanarPoint } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `autoMoviePlanarRegionFailure({ outer, holes?, label? })` returns the first
 * hygiene failure of a planar region, or null when it bounds one unambiguous
 * region. Rings are named "<label> outer ring" and "<label> hole[i]", label
 * "polygon" by default.
 *
 * Scenarios:
 *
 * 1. A 4 m square, alone or with a unit hole inside: null.
 * 2. Outer-ring defects, each the first one found: two points; (0,0) repeated;
 *    three collinear points (no area); (0,0), (3,0), (2,0), (2,2) doubling back
 *    at corner 1; (0,0), (2,2), (2,0), (0,3) crossing between edges 0 and 2;
 *    the label "section" names the ring.
 * 3. Ring relations: a hole touching the outer ring at (0, 1) (outer edge 3, hole
 *    edge 0); a hole outside the outer ring; a hole inside another hole.
 * 4. A unit square at (1e8, 1e8) has nonzero area and passes admission.
 */
export function test_engine_geometry_planar_region_failure(): void {
  const ring = (...xy: number[]): IAutoMoviePlanarPoint[] =>
    Array.from({ length: xy.length / 2 }, (_: unknown, i: number) => ({
      x: xy[2 * i]!,
      y: xy[2 * i + 1]!,
    }));
  const outer: IAutoMoviePlanarPoint[] = ring(0, 0, 4, 0, 4, 4, 0, 4);

  // 1.
  TestValidator.equals("square", autoMoviePlanarRegionFailure({ outer }), null);
  TestValidator.equals(
    "holed",
    autoMoviePlanarRegionFailure({
      outer,
      holes: [ring(1, 1, 2, 1, 2, 2, 1, 2)],
    }),
    null,
  );

  // 2.
  for (const [label, r, message] of [
    [
      "two points",
      ring(0, 0, 1, 0),
      "polygon outer ring needs at least three points",
    ],
    [
      "repeat",
      ring(0, 0, 0, 0, 1, 0, 0, 1),
      "polygon outer ring[0] repeats the point beside it",
    ],
    ["no area", ring(0, 0, 1, 0, 2, 0), "polygon outer ring encloses no area"],
    [
      "spike",
      ring(0, 0, 3, 0, 2, 0, 2, 2),
      "polygon outer ring[1] doubles back along its own edge",
    ],
    [
      "bowtie",
      ring(0, 0, 2, 2, 2, 0, 0, 3),
      "polygon outer ring crosses itself between edge 0 and edge 2",
    ],
  ] satisfies [string, IAutoMoviePlanarPoint[], string][])
    TestValidator.equals(
      label,
      autoMoviePlanarRegionFailure({ outer: r }),
      message,
    );
  TestValidator.equals(
    "label",
    autoMoviePlanarRegionFailure({ outer: ring(0, 0, 1, 0), label: "section" }),
    "section outer ring needs at least three points",
  );

  // 3.
  for (const [label, holes, message] of [
    [
      "touch",
      [ring(0, 1, 1, 1, 1, 2)],
      "polygon outer ring and polygon hole[0] touch or cross at edge 3 and edge 0",
    ],
    [
      "outside",
      [ring(5, 5, 6, 5, 6, 6)],
      "polygon hole[0] must lie inside polygon outer ring",
    ],
    [
      "nested",
      [ring(1, 1, 3, 1, 3, 3, 1, 3), ring(1.5, 1.5, 2, 1.5, 2, 2, 1.5, 2)],
      "polygon hole[1] must lie outside polygon hole[0]",
    ],
  ] satisfies [string, IAutoMoviePlanarPoint[][], string][])
    TestValidator.equals(
      label,
      autoMoviePlanarRegionFailure({ outer, holes }),
      message,
    );

  // 4.
  const offset: number = 1e8;
  const translated: IAutoMoviePlanarPoint[] = [
    { x: offset, y: offset },
    { x: offset + 1, y: offset },
    { x: offset + 1, y: offset + 1 },
    { x: offset, y: offset + 1 },
  ];
  TestValidator.equals(
    "translated square admitted",
    autoMoviePlanarRegionFailure({ outer: translated }),
    null,
  );
}
