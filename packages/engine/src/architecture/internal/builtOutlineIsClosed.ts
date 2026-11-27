import {
  IAutoMoviePlanarPoint,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { AutoMovieEngineBuiltPlanarEpsilon } from "../AutoMovieEngineBuiltPlanarEpsilon";
import { polygonShortestEdge } from "./polygonShortestEdge";

/*
 * Whether a closed planar outline names enough distinct, finite corners,
 * reporting the first reason it does not.
 *
 * The minimum corner count differs by what the outline may carry: a straight
 * face needs three, while an outline whose edges may bulge needs only two,
 * because a full circle is two half-turn arcs and demanding a third corner
 * would outlaw a round oculus for no geometric reason. Then every coordinate
 * must be finite, each non-finite one reported at `<path>[i].<axis>`, and no
 * two consecutive corners, the closing pair included, may lie within
 * `AutoMovieEngineBuiltPlanarEpsilon` (1e-9 m) of each other. A failed count or a non-finite
 * corner stops before the later test, which could not be computed.
 * Parameter outline: Closed ring of corners, in metres.
 * Parameter least: Fewest corners the outline may have.
 * Parameter path: Violation path of the outline.
 * Parameter label: Name of the outline in the messages.
 * Parameter collector: Sink that receives the violations.
 * Returns: True when the outline passed every check.
 */
export function builtOutlineIsClosed(
  outline: readonly IAutoMoviePlanarPoint[],
  least: number,
  path: string,
  label: string,
  collector: IAutoMovieViolationCollector,
): boolean {
  if (outline.length < least) {
    collector.push(
      "range",
      path,
      `${label} needs at least ${least} points, but had ${outline.length}`,
      outline.length,
    );
    return false;
  }

  if (polygonShortestEdge(outline) <= AutoMovieEngineBuiltPlanarEpsilon) {
    collector.push(
      "range",
      path,
      `${label} must not repeat a point at consecutive corners`,
      outline,
    );
    return false;
  }
  return true;
}
