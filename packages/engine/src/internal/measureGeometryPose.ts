import {
  type IAutoMovieGeometryActorReader,
  type IAutoMovieGeometryMeasurementInput,
  type IAutoMovieGeometryQuery,
  IAutoMovieGeometryResult,
} from "@automovie/interface";

import { createGeometryActorReader } from "./createGeometryActorReader";

/*
 * Summarize an actor's sampled or held pose at shot-local seconds, reporting
 * world root position, joint count and motion-held status; lookup and time
 * failures throw.
 */
export function measureGeometryPose(
  props: IAutoMovieGeometryMeasurementInput,
  request: Extract<IAutoMovieGeometryQuery, { query: "pose" }>,
): IAutoMovieGeometryResult {
  const reader: IAutoMovieGeometryActorReader =
    createGeometryActorReader(props.compiled);

  const sampled: ReturnType<typeof reader.pose> = reader.pose(
    request.actor,
    request.shot,
    request.time,
  );

  return {
    kind: "measurement",
    values: sampled,
  };
}
