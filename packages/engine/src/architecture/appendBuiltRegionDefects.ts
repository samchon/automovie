import { IAutoMoviePlanarPoint } from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";
import { PLANAR_EPSILON } from "./constants/PLANAR_EPSILON";
import { polygonDoubleArea } from "./polygonDoubleArea";
import { polygonIsSimple } from "./polygonIsSimple";

/**
 * Report a closed region an inside test cannot be run against.
 *
 * The authored contract requires non-negligible area and a simple ring; an even-odd interpretation of self-crossing rings is outside it. Non-finite doubled signed area or magnitude at most `PLANAR_EPSILON` (1e-9) gets one `range` finding. Otherwise a self-crossing/touching ring gets one `type` finding, at `path`.
 *
 * @param region Closed ring to judge; for an opening, its arc-bounding hull.
 * @param path Violation path to report at.
 * @param label Name of the region in the messages.
 * @param collector Sink that receives the violations.
 *
 * @evidence contracts/common.md#principled-implementation Refuses non-finite or near-zero computed shoelace area before the shared edge-contact simplicity check. These checks enforce the chosen simple-region contract; they do not assert that every self-crossing ring lacks an even-odd interpretation or certify exact-real area from binary64 arithmetic.
 * @evidence contracts/common.md#clear-and-simple-design One region rule shared by boundary faces and opening voids, applied to the outline a face states and to the hull an arched opening bounds.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No region is re-wound, simplified or repaired, and orientation is not judged because either winding has an inside.
 * @evidence contracts/common.md#meaningful-documentation The documentation states why both conditions matter, the area tolerance, which violation each produces and in what order, and each parameter's role.
 * @evidence contracts/performance.md#efficient-algorithms O(N) area work followed, when needed, by O(N²) edge-pair simplicity work; no small fixed outline size is assumed.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A check of one region per call; each outline is judged once per validation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Allocates nothing beyond at most one violation appended to the caller's collector.
 */
export const appendBuiltRegionDefects: (region: readonly IAutoMoviePlanarPoint[], path: string, label: string, collector: ViolationCollector) => void = (
  region: readonly IAutoMoviePlanarPoint[],
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  const area: number = polygonDoubleArea(region);
  if (!Number.isFinite(area) || Math.abs(area) <= PLANAR_EPSILON)
    collector.push("range", path, `${label} needs finite non-negligible area`, region);
  else if (polygonIsSimple(region) === false)
    collector.push("type", path, `${label} must not cross itself`, region);
};
