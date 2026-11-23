import {
  type IAutoMovieGeometryMeasurementInput,
  type IAutoMovieGeometryQuery,
  IAutoMovieGeometryResult,
} from "@automovie/interface";

import { measureAutoMovieGeometryCamera } from "./measureAutoMovieGeometryCamera";
import { measureAutoMovieGeometryDistance } from "./measureAutoMovieGeometryDistance";
import { measureAutoMovieGeometryEffect } from "./measureAutoMovieGeometryEffect";
import { measureAutoMovieGeometryFilmTime } from "./measureAutoMovieGeometryFilmTime";
import { measureAutoMovieGeometryFormation } from "./measureAutoMovieGeometryFormation";
import { measureAutoMovieGeometryGround } from "./measureAutoMovieGeometryGround";
import { measureAutoMovieGeometryPose } from "./measureAutoMovieGeometryPose";
import { measureAutoMovieGeometryReach } from "./measureAutoMovieGeometryReach";

/**
 * Answer one geometry question from caller-established current records;
 * unresolvable records or times throw a correction-bearing error.
 */
export function measureAutoMovieGeometry(
  props: IAutoMovieGeometryMeasurementInput,
): IAutoMovieGeometryResult {
  const request: IAutoMovieGeometryQuery = props.request;
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
