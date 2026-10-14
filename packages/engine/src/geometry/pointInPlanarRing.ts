import { IAutoMoviePlanarPoint } from "@automovie/interface";

/**
 * Whether a point lies inside a closed ring by the even-odd rule, casting a
 * ray along +X.
 *
 * The answer is defined only for a point off the ring: both callers have
 * already refused ring contact, so the point they probe never lies on an edge.
 * The ring may be wound either way. Unlike the architecture graph's
 * `pointInPolygon`, a boundary point is not classified as inside.
 *
 * @param point Point to classify.
 * @param ring Closed ring, the last corner joined back to the first.
 * @returns True when the ray crosses the ring an odd number of times.
 *
 * @evidence contracts/common.md#principled-implementation The even-odd crossing count with a half-open `y` test, so a vertex on the ray is counted once; exact for a simple ring and a point off it, which region validation and hole bridging guarantee before calling.
 * @evidence contracts/common.md#clear-and-simple-design Shared by region validation and hole bridging, which previously each kept an identical private copy, so a hole judged inside the outer ring is judged the same way when its bridge midpoint is tested.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No tolerance or boundary rule is added for a particular caller; the off-ring premise is stated instead of being patched with a boundary test.
 * @evidence contracts/common.md#meaningful-documentation States the rule and ray direction, the off-ring premise and who guarantees it, the winding freedom, and how it differs from `pointInPolygon` on the boundary.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the n ring edges, O(n) time and O(1) space, the lower bound for an unindexed ring.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Callers probe one point per ring pair or bridge candidate, too few against any one ring to repay an index.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Keeps a loop index and one parity flag for the call and allocates nothing.
 */
export const pointInPlanarRing = (
  point: IAutoMoviePlanarPoint,
  ring: readonly IAutoMoviePlanarPoint[],
): boolean => {
  let inside: boolean = false;
  for (let index: number = 0; index < ring.length; ++index) {
    const from: IAutoMoviePlanarPoint = ring[index]!;
    const to: IAutoMoviePlanarPoint = ring[(index + 1) % ring.length]!;
    if (
      from.y > point.y !== to.y > point.y &&
      point.x <
        from.x + ((point.y - from.y) / (to.y - from.y)) * (to.x - from.x)
    )
      inside = !inside;
  }
  return inside;
};
