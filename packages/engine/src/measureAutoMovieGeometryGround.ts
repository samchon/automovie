import {
  AutoMovieGeometryQuery,
  IAutoMovieGeometryResult,
} from "@automovie/interface";

import { IAutoMovieGeometryMeasurementInput } from "./IAutoMovieGeometryMeasurementInput";
import { readAutoMovieGeometryGround } from "./readAutoMovieGeometryGround";

/**
 * Answer terrain height, surface id and walkability under a world XZ point in metres, including the explicit off-world result.
 *
 * @evidence contracts/common.md#principled-implementation Uses readAutoMovieGeometryGround so surface precedence and interpolated terrain height agree with formation-ground checks and engine placement.
 * @evidence contracts/common.md#clear-and-simple-design The query adapter converts the shared ground sample to the public ground result without duplicating containment or height rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No surface yields zero, null and false together; no walkable terrain is invented when the world is absent.
 * @evidence contracts/common.md#meaningful-documentation States units, terrain fields and off-world meaning.
 * @evidence contracts/performance.md#efficient-algorithms The delegated first-containing-surface scan dominates cost; packaging three fields takes constant work and space.
 * @evidence contracts/performance.md#reuse-equivalent-work The helper reads the supplied current world every call, so terrain edits require no hidden cache invalidation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only scalar sample fields are returned; no world records, handles or tasks are retained.
 */
export function measureAutoMovieGeometryGround(
  props: IAutoMovieGeometryMeasurementInput,
  request: Extract<AutoMovieGeometryQuery, { query: "ground" }>,
): IAutoMovieGeometryResult {
  const sample: ReturnType<typeof readAutoMovieGeometryGround> =
    readAutoMovieGeometryGround(props.design.world, request.point);

  return {
    kind: "ground",
    height: sample.height,
    surface: sample.surface,
    walkable: sample.walkable,
  };
}
