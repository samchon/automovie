import {
  AutoMovieGeometryQuery,
  IAutoMovieGeometryResult,
} from "@automovie/interface";

import { IAutoMovieGeometryMeasurementInput } from "./IAutoMovieGeometryMeasurementInput";
import { measureAutoMovieGeometryCamera } from "./measureAutoMovieGeometryCamera";
import { measureAutoMovieGeometryDistance } from "./measureAutoMovieGeometryDistance";
import { measureAutoMovieGeometryEffect } from "./measureAutoMovieGeometryEffect";
import { measureAutoMovieGeometryFilmTime } from "./measureAutoMovieGeometryFilmTime";
import { measureAutoMovieGeometryFormation } from "./measureAutoMovieGeometryFormation";
import { measureAutoMovieGeometryGround } from "./measureAutoMovieGeometryGround";
import { measureAutoMovieGeometryPose } from "./measureAutoMovieGeometryPose";
import { measureAutoMovieGeometryReach } from "./measureAutoMovieGeometryReach";

/**
 * Answer one geometry question from caller-established current records; unresolvable records or times throw a correction-bearing error.
 *
 * @evidence contracts/common.md#principled-implementation Dispatches the discriminated query to distance, reach, ground, formation, effect, film-time, pose or camera measurement; numerical queries inspect records rather than render pixels, and callers establish freshness.
 * @evidence contracts/common.md#clear-and-simple-design The switch owns query selection while separate helpers own admission and measurement for each query, keeping terrain and actor resolution shared.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No consumer identity changes an answer; camera answers explicitly report occlusionMeasured=false and effect visibility risk is an analytic proxy rather than pixel occlusion.
 * @evidence contracts/common.md#meaningful-documentation States freshness responsibility, supported record-only measurements and correction-bearing failure; each helper documents its numeric frame and limits.
 * @evidence contracts/performance.md#efficient-algorithms Only the selected branch runs; its actor, bone, formation, particle or timeline dimensions determine cost, with no full-project rebuild or rendering.
 * @evidence contracts/performance.md#reuse-equivalent-work Every call reads the supplied snapshots; no cached answer can outlive mutable design or compiled input.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned measurement values belong to the caller; the dispatcher retains no maps, handles or tasks after return or throw.
 */
export function measureAutoMovieGeometry(
  props: IAutoMovieGeometryMeasurementInput,
): IAutoMovieGeometryResult {
  const request: AutoMovieGeometryQuery = props.request;
  switch (request.query) {
    case "distance":
      return measureAutoMovieGeometryDistance(props, request);
    case "reach":
      return measureAutoMovieGeometryReach(props, request);
    case "ground":
      return measureAutoMovieGeometryGround(props, request);
    case "formation":
      return measureAutoMovieGeometryFormation(props, request);
    case "effect":
      return measureAutoMovieGeometryEffect(props, request);
    case "film-time":
      return measureAutoMovieGeometryFilmTime(props, request);
    case "pose":
      return measureAutoMovieGeometryPose(props, request);
    case "camera":
      return measureAutoMovieGeometryCamera(props, request);
  }
}
