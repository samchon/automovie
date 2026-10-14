import {
  AutoMovieGeometryQuery,
  IAutoMovieGeometryResult,
} from "@automovie/interface";

import { IAutoMovieGeometryMeasurementInput } from "./IAutoMovieGeometryMeasurementInput";
import { createAutoMovieGeometryActorReader } from "./createAutoMovieGeometryActorReader";

/**
 * Summarize an actor's sampled or held pose at shot-local seconds, reporting world root position, joint count and motion-held status; lookup and time failures throw.
 *
 * @evidence contracts/common.md#principled-implementation Delegates performance offset and object-channel sampling to the shared actor reader, which composes the pose-root point through node TRS and strips root only for rig FK.
 * @evidence contracts/common.md#clear-and-simple-design The pose query packages the reader's summary without duplicating motion lookup or root-placement rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A held actor with no authored pose has an explicit empty pose; absent motion records and out-of-range time refuse rather than silently becoming held.
 * @evidence contracts/common.md#meaningful-documentation States shot-local sampling, world root position, held meaning and failure.
 * @evidence contracts/performance.md#efficient-algorithms Actor/model/performance/motion scans and one spatial sample dominate cost; the returned joint count reads the sampled pose without a separate FK pass.
 * @evidence contracts/performance.md#reuse-equivalent-work The actor reader computes one spatial sample for root coordinates and joint count; no snapshot-dependent summary is retained across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only scalar summary fields escape; sampled poses and closures become collectible after completion with no resource handles.
 */
export function measureAutoMovieGeometryPose(
  props: IAutoMovieGeometryMeasurementInput,
  request: Extract<AutoMovieGeometryQuery, { query: "pose" }>,
): IAutoMovieGeometryResult {
  const reader: ReturnType<typeof createAutoMovieGeometryActorReader> =
    createAutoMovieGeometryActorReader(props.compiled);

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
