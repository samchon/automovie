import {
  AutoMovieGeometryQuery,
  IAutoMovieGeometryResult,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieGeometryMeasurementInput } from "./IAutoMovieGeometryMeasurementInput";
import { createAutoMovieGeometryActorReader } from "./createAutoMovieGeometryActorReader";
import { Vector3 } from "./math/Vector3";

/**
 * Measure Euclidean distance in world metres between point, landmark or actor/bone selectors; invalid time or unresolved selectors throw.
 *
 * @evidence contracts/common.md#principled-implementation Resolves both selectors through the shared actor reader then takes the norm of their difference, preserving pose-root and node affine stages for bones.
 * @evidence contracts/common.md#clear-and-simple-design The distance branch owns time admission and subtraction; selector record ownership and sampling stay in the shared reader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Finite nonnegative explicit time is required; unresolved or ambiguous records refuse rather than selecting an arbitrary actor or returning zero.
 * @evidence contracts/common.md#meaningful-documentation States world-metre output and invalid-time or selector failure.
 * @evidence contracts/performance.md#efficient-algorithms Two selector resolutions dominate cost: landmark scans or actor/model scans plus FK for bone selectors; subtraction and norm are constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work The two selectors share a reader over current records but no cross-call memoized geometry; differing actors and times remain independent.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The reader and resolved points are call-local; the returned distance scalar retains no compiled records or handles.
 */
export function measureAutoMovieGeometryDistance(
  props: IAutoMovieGeometryMeasurementInput,
  request: Extract<AutoMovieGeometryQuery, { query: "distance" }>,
): IAutoMovieGeometryResult {
  const reader: ReturnType<typeof createAutoMovieGeometryActorReader> =
    createAutoMovieGeometryActorReader(props.compiled);

  if (
    request.time !== undefined &&
    (Number.isFinite(request.time) === false || request.time < 0)
  )
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
    meters: Vector3.length(Vector3.subtract(left, right)),
  };
}
