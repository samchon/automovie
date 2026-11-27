import {
  type IAutoMovieGeometryMeasurementInput,
  type IAutoMovieGeometryQuery,
  IAutoMovieGeometryResult,
} from "@automovie/interface";

import { measureAutoMovieGeometryCamera } from "./internal/measureAutoMovieGeometryCamera";
import { measureAutoMovieGeometryDistance } from "./internal/measureAutoMovieGeometryDistance";
import { measureAutoMovieGeometryEffect } from "./internal/measureAutoMovieGeometryEffect";
import { measureAutoMovieGeometryFilmTime } from "./internal/measureAutoMovieGeometryFilmTime";
import { measureAutoMovieGeometryFormation } from "./internal/measureAutoMovieGeometryFormation";
import { measureAutoMovieGeometryGround } from "./internal/measureAutoMovieGeometryGround";
import { measureAutoMovieGeometryPose } from "./internal/measureAutoMovieGeometryPose";
import { measureAutoMovieGeometryReach } from "./internal/measureAutoMovieGeometryReach";

/** Measure current film geometry from caller-established records. */
export namespace AutoMovieEngineGeometryObservation {
  /**
   * Answer one geometry question from caller-established current records;
   * unresolvable records or times throw a correction-bearing error.
   */
  export function measure(
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
}
