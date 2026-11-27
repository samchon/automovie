import {
  type IAutoMovieGeometryActorReader,
  type IAutoMovieGeometryMeasurementInput,
  type IAutoMovieGeometryQuery,
  IAutoMovieGeometryResult,
  IAutoMovieVector3,
} from "@automovie/interface";

import { createGeometryActorReader } from "./createGeometryActorReader";
import { AutoMovieEngineVector3 } from "../math/AutoMovieEngineVector3";

/*
 * Measure Euclidean distance in world metres between point, landmark or
 * actor/bone selectors; invalid time or unresolved selectors throw.
 */
export function measureGeometryDistance(
  props: IAutoMovieGeometryMeasurementInput,
  request: Extract<IAutoMovieGeometryQuery, { query: "distance" }>,
): IAutoMovieGeometryResult {
  const reader: IAutoMovieGeometryActorReader =
    createGeometryActorReader(props.compiled);

  if (request.time !== undefined && request.time < 0)
    throw new Error(
      `Distance sample time ${request.time} is invalid. Choose a finite non-negative shot time.`,
    );

  const options: { shot?: string; time?: number } = {
    shot: request.shot,
    time: request.time,
  };

  const left: IAutoMovieVector3 = reader.selector(
    request.from,
    props.design.world,
    options,
  );

  const right: IAutoMovieVector3 = reader.selector(
    request.to,
    props.design.world,
    options,
  );

  return {
    kind: "distance",
    meters: AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(left, right)),
  };
}
