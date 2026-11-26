import {
  IAutoMoviePlanarPoint,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { BUILT_PLANAR_EPSILON } from "./constants/BUILT_PLANAR_EPSILON";
import { polygonDoubleArea } from "./polygonDoubleArea";
import { polygonIsSimple } from "./polygonIsSimple";

/**
 * Report a closed region an inside test cannot be run against.
 *
 * The authored contract requires non-negligible area and a simple ring; an
 * even-odd interpretation of self-crossing rings is outside it. Non-finite
 * doubled signed area or magnitude at most `BUILT_PLANAR_EPSILON` (1e-9) gets
 * one `range` finding. Otherwise a self-crossing/touching ring gets one `type`
 * finding, at `path`.
 *
 * @param region Closed ring to judge; for an opening, its arc-bounding hull.
 * @param path Violation path to report at.
 * @param label Name of the region in the messages.
 * @param collector Sink that receives the violations.
 */
export function appendBuiltRegionDefects(
  region: readonly IAutoMoviePlanarPoint[],
  path: string,
  label: string,
  collector: IAutoMovieViolationCollector,
): void {
  const area: number = polygonDoubleArea(region);
  if (Math.abs(area) <= BUILT_PLANAR_EPSILON)
    collector.push(
      "range",
      path,
      `${label} needs finite non-negligible area`,
      region,
    );
  else if (polygonIsSimple(region) === false)
    collector.push("type", path, `${label} must not cross itself`, region);
}
