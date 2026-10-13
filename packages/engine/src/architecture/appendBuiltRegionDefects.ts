import { IAutoMoviePlanarPoint } from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";
import { PLANAR_EPSILON } from "./constants/PLANAR_EPSILON";
import { polygonDoubleArea } from "./polygonDoubleArea";
import { polygonIsSimple } from "./polygonIsSimple";

/**
 * Report a closed region an inside test cannot be run against.
 *
 * Real area and no self-crossing are not stylistic demands: without them
 * "inside this region" has no answer, and every later containment or
 * separation result would be arbitrary rather than merely wrong. A region
 * whose doubled signed area is within `PLANAR_EPSILON` (1e-9) of zero gets one
 * `range` violation; otherwise a region that crosses or touches itself gets
 * one `type` violation. Both are reported at `path`.
 *
 * @param region Closed ring to judge; for an opening, its arc-bounding hull.
 * @param path Violation path to report at.
 * @param label Name of the region in the messages.
 * @param collector Sink that receives the violations.
 *
 * @evidence contracts/common.md#principled-implementation Uses the shoelace area to detect a region with no interior and the shared non-adjacent edge contact test to detect self-crossing, the two conditions under which even-odd containment is undefined; simplicity is only tested once area exists, because a flat ring trivially touches itself.
 * @evidence contracts/common.md#clear-and-simple-design One region rule shared by boundary faces and opening voids, applied to the outline a face states and to the hull an arched opening bounds.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No region is re-wound, simplified or repaired, and orientation is not judged because either winding has an inside.
 * @evidence contracts/common.md#meaningful-documentation The documentation states why both conditions matter, the area tolerance, which violation each produces and in what order, and each parameter's role.
 * @evidence contracts/performance.md#efficient-algorithms O(n) for the area and O(n²) for the simplicity test over n corners, which authored faces and voids keep in the tens.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A check of one region per call; each outline is judged once per validation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Allocates nothing beyond at most one violation appended to the caller's collector.
 */
export const appendBuiltRegionDefects = (
  region: readonly IAutoMoviePlanarPoint[],
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (Math.abs(polygonDoubleArea(region)) <= PLANAR_EPSILON)
    collector.push("range", path, `${label} encloses no area`, region);
  else if (polygonIsSimple(region) === false)
    collector.push("type", path, `${label} must not cross itself`, region);
};
