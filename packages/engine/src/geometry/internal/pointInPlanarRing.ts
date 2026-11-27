import { IAutoMoviePlanarPoint } from "@automovie/interface";

/*
 * Whether a point lies inside a closed ring by the even-odd rule, casting a ray
 * along +X.
 *
 * The answer is defined only for a point off the ring: both callers have
 * already refused ring contact, so the point they probe never lies on an edge.
 * The ring may be wound either way. Unlike the architecture graph's
 * `pointInPolygon`, a boundary point is not classified as inside.
 * Parameter point: Point to classify.
 * Parameter ring: Closed ring, the last corner joined back to the first.
 * Returns: True when the ray crosses the ring an odd number of times.
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
