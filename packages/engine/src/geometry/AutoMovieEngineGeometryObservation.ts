import {
  type IAutoMovieGeometryMeasurementInput,
  type IAutoMovieGeometryQuery,
  IAutoMovieGeometryResult,
} from "@automovie/interface";

import { measureGeometryCamera } from "../internal/measureGeometryCamera";
import { measureGeometryDistance } from "../internal/measureGeometryDistance";
import { measureGeometryEffect } from "../internal/measureGeometryEffect";
import { measureGeometryFilmTime } from "../internal/measureGeometryFilmTime";
import { measureGeometryFormation } from "../internal/measureGeometryFormation";
import { measureGeometryGround } from "../internal/measureGeometryGround";
import { measureGeometryPose } from "../internal/measureGeometryPose";
import { measureGeometryReach } from "../internal/measureGeometryReach";

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
        return measureGeometryDistance(props, request);
      case "reach":
        return measureGeometryReach(props, request);
      case "ground":
        return measureGeometryGround(props, request);
      case "formation":
        return measureGeometryFormation(props, request);
      case "effect":
        return measureGeometryEffect(props, request);
      case "film-time":
        return measureGeometryFilmTime(props, request);
      case "pose":
        return measureGeometryPose(props, request);
      case "camera":
        return measureGeometryCamera(props, request);
    }
  }
}
