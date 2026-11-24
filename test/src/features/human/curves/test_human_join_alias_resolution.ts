import { AutoMovieHumanJoinLoop } from "@automovie/human";

/**
 * The resolution at which a side join's search recognizes a seed on a loop it has already traced.
 *
 * The made walls are the plane `z = 0` and the plane through the x axis turned by `alpha` about it,
 * `-sin(alpha) y + cos(alpha) z = 0`; they meet on the x axis. A seed on the first plane at `(0, y0, 0)` stands `|sin(alpha) y0|`
 * from the second, its meeting gap.
 *
 * Scenarios:
 * 1. With the armscye seed's measured gap (5.378e-4 mm) and angle (0.2935 rad), the seed stands `gap / sin(alpha)` from the axis, and
 *    the resolution is the tolerance plus exactly that distance, so the seed is recognized on the axis's loop.
 * 2. A second line in the first plane 1e-3 mm from the axis stands nearer the seed than the resolution, so it is aliased: the stated
 *    resolution limit of a trace converged to the tolerance. A line one tolerance past the resolution is not.
 * 3. A grazing angle gives no resolution beyond the tolerance.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieHumanJoinLoop.aliasResolution` as the search's alias test does.
 * @evidence contracts/development/testing.md#independent-expectations The distance from a point of one plane to two planes' common line is its distance to the other plane over the sine of their angle.
 * @evidence contracts/development/testing.md#distinguishing-cases The old test (the tolerance alone, 1e-3 mm) misses scenario 1's seed at 1.83e-3 mm; scenario 2 reads both sides of the limit.
 * @evidence contracts/development/testing.md#execution-ownership Two made planes; no surface, trace or person.
 * @evidence contracts/development/common.md#meaningful-documentation Names the planes, the measured seed and the resolution limit.
 */
export function test_human_join_alias_resolution(): void {
  const failures: string[] = [];
  const tolerance: number = 1e-3, gap: number = 5.378e-4, alpha: number = 0.2935;

  // The seed's place on the first plane: its distance to the second is |sin(alpha) y0| = gap.
  const y0: number = gap / Math.sin(alpha);
  const resolution: number = AutoMovieHumanJoinLoop.aliasResolution(tolerance, gap, alpha);
  if (!(Math.abs(resolution - tolerance - y0) <= 1e-15 * (1 + y0)))
    failures.push("the resolution " + resolution + " is not the tolerance plus the seed's distance " + y0 + " to the walls' line");
  if (!(y0 > tolerance && y0 <= resolution)) failures.push("the seed at " + y0 + " mm is not recognized, or the old tolerance would have recognized it");

  // A second line in the first plane at 1e-3 mm from the axis is within the resolution of the seed; one past it is not.
  const near: number = Math.abs(y0 - 1e-3), far: number = Math.abs(y0 - (resolution + y0 + tolerance));
  if (!(near <= resolution)) failures.push("a second loop 1e-3 mm from the first is not stated as aliased");
  if (!(far > resolution)) failures.push("a loop past the resolution is aliased");
  if (AutoMovieHumanJoinLoop.aliasResolution(tolerance, gap, 0) !== tolerance) failures.push("a grazing angle widened the resolution");
  if (failures.length > 0) throw new Error("join alias resolution:\n" + failures.join("\n"));
}
