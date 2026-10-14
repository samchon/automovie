import { IAutoMoviePlanarPoint } from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";
import { PLANAR_EPSILON } from "./constants/PLANAR_EPSILON";
import { polygonShortestEdge } from "./polygonShortestEdge";

/**
 * Whether a closed planar outline names enough distinct, finite corners,
 * reporting the first reason it does not.
 *
 * The minimum corner count differs by what the outline may carry: a straight
 * face needs three, while an outline whose edges may bulge needs only two,
 * because a full circle is two half-turn arcs and demanding a third corner
 * would outlaw a round oculus for no geometric reason. Then every coordinate
 * must be finite, each non-finite one reported at `<path>[i].<axis>`, and no
 * two consecutive corners, the closing pair included, may lie within
 * `PLANAR_EPSILON` (1e-9 m) of each other. A failed count or a non-finite
 * corner stops before the later test, which could not be computed.
 *
 * @param outline Closed ring of corners, in metres.
 * @param least Fewest corners the outline may have.
 * @param path Violation path of the outline.
 * @param label Name of the outline in the messages.
 * @param collector Sink that receives the violations.
 * @returns True when the outline passed every check.
 *
 * @evidence contracts/common.md#principled-implementation The corner floor follows from what closes an area with straight edges versus half-turn arcs, and a repeated consecutive corner is detected as a zero shortest edge, which would otherwise make edge directions and arc chords undefined.
 * @evidence contracts/common.md#clear-and-simple-design One outline rule shared by boundary faces and opening voids in building validation, with the corner floor as the one parameter that differs between them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No outline is padded, deduplicated or repaired, and the two floors are the contract's own difference between straight and bulged outlines.
 * @evidence contracts/common.md#meaningful-documentation The documentation states both floors and why, the finiteness rule and its paths, the repeated-corner tolerance and units, where checking stops, and each parameter's role.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the corner count: one finiteness pass and one shortest-edge pass.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A check of one outline per call; each face and opening outline is checked once per validation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Allocates nothing beyond the violations, at most one per coordinate or one for the count or the repeat, appended to the caller's collector.
 */
export const builtOutlineIsClosed: (
  outline: readonly IAutoMoviePlanarPoint[],
  least: number,
  path: string,
  label: string,
  collector: ViolationCollector,
) => boolean = (
  outline: readonly IAutoMoviePlanarPoint[],
  least: number,
  path: string,
  label: string,
  collector: ViolationCollector,
): boolean => {
  if (outline.length < least) {
    collector.push(
      "range",
      path,
      `${label} needs at least ${least} points, but had ${outline.length}`,
      outline.length,
    );
    return false;
  }
  let finite: boolean = true;
  outline.forEach((point: IAutoMoviePlanarPoint, index: number): void => {
    for (const axis of ["x", "y"] as const)
      if (!Number.isFinite(point[axis])) {
        finite = false;
        collector.push(
          "range",
          `${path}[${index}].${axis}`,
          `${label} ${axis} must be finite, but was ${point[axis]}`,
          point[axis],
        );
      }
  });
  if (!finite) return false;
  if (polygonShortestEdge(outline) <= PLANAR_EPSILON) {
    collector.push(
      "range",
      path,
      `${label} must not repeat a point at consecutive corners`,
      outline,
    );
    return false;
  }
  return true;
};
