import { canonicalRegion } from "@automovie/engine";
import type { IAutoMovieProfilePoint } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * `canonicalRegion(outer, holes, label)` validates a planar region and lays it
 * out canonically: copied points, outer ring counter-clockwise, holes
 * clockwise, outer first; `sourceIndices` maps each point back to the flattened
 * input; `area` is the enclosed area.
 *
 * Scenarios:
 *
 * 1. A clockwise unit square is reversed: points (1,0), (1,1), (0,1), (0,0),
 *    source indices [3, 2, 1, 0], area 1.
 * 2. A counter-clockwise 4 m square with a counter-clockwise unit hole: the outer
 *    is kept, the hole reversed (source indices [0..3, 7, 6, 5, 4]), rings {0,
 *    4} and {4, 4}, area 15; the inputs are unchanged and the points are
 *    copies.
 * 3. A two-point outer ring under label "section" is refused with "section outer
 *    ring needs at least three points".
 */
export function test_engine_geometry_canonical_region(): void {
  const ring = (...xy: number[]): IAutoMovieProfilePoint[] =>
    Array.from({ length: xy.length / 2 }, (_: unknown, i: number) => ({
      x: xy[2 * i]!,
      y: xy[2 * i + 1]!,
    }));

  // 1.
  const cw = canonicalRegion(ring(0, 0, 0, 1, 1, 1, 1, 0), [], "square");
  TestValidator.equals("reversed", cw, {
    points: ring(1, 0, 1, 1, 0, 1, 0, 0),
    sourceIndices: [3, 2, 1, 0],
    rings: [{ start: 0, count: 4 }],
    area: 1,
  });

  // 2.
  const outer: IAutoMovieProfilePoint[] = ring(0, 0, 4, 0, 4, 4, 0, 4);
  const hole: IAutoMovieProfilePoint[] = ring(1, 1, 2, 1, 2, 2, 1, 2);
  const before: string = JSON.stringify([outer, hole]);
  const holed = canonicalRegion(outer, [hole], "holed");
  TestValidator.equals("points", holed.points, [
    ...outer,
    ...ring(1, 2, 2, 2, 2, 1, 1, 1),
  ]);
  TestValidator.equals("source", holed.sourceIndices, [0, 1, 2, 3, 7, 6, 5, 4]);
  TestValidator.equals("rings", holed.rings, [
    { start: 0, count: 4 },
    { start: 4, count: 4 },
  ]);
  TestValidator.equals("area", holed.area, 15);
  TestValidator.equals("inputs kept", JSON.stringify([outer, hole]), before);
  TestValidator.predicate("copies", holed.points[0] !== outer[0]);

  // 3.
  TestValidator.predicate(
    "refused",
    throwsError(
      (): unknown => canonicalRegion(ring(0, 0, 1, 0), [], "section"),
      "section outer ring needs at least three points",
    ),
  );
}
