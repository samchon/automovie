import {
  IAutoMovieBeatEndState,
  IAutoMovieValidation,
} from "@automovie/interface";

import { IAutoMovieContinuityTolerances } from "./IAutoMovieContinuityTolerances";
import { ViolationCollector } from "./ViolationCollector";
import { compareContinuityBoundary } from "./compareContinuityBoundary";
import { readContinuityTolerances } from "./readContinuityTolerances";

/**
 * Compare every prior-end actor to the incoming opening for missing presence, Euclidean drift, facing angle and persistent mount changes.
 *
 * @evidence contracts/common.md#principled-implementation Compare every prior-end actor to the incoming opening for missing presence, Euclidean drift, facing angle and persistent mount changes.
 * @evidence contracts/common.md#clear-and-simple-design One pairwise owner appends advisory faults; tolerance admission precedes snapshot comparison.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only prior actors are required to persist; new incoming actors are allowed and drift warnings do not refuse an intentional cut.
 * @evidence contracts/common.md#meaningful-documentation Metre/degree tolerances default50mm/5deg and missing/mount warnings carry actor paths.
 * @evidence contracts/performance.md#efficient-algorithms P prior actors and O opening actors require O(P+O) indexing/comparison plus id text.
 * @evidence contracts/performance.md#reuse-equivalent-work The opening id map shares lookup work within this boundary, without caching mutable snapshots.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Snapshots are borrowed; only report rows escape and no film playback state is retained.
 */
export const validateContinuity: (props: {
  previous: IAutoMovieBeatEndState;
  opening: IAutoMovieBeatEndState;
  positionTolerance?: number;
  facingToleranceDeg?: number;
}) => IAutoMovieValidation = (props: {
  /** The previous beat's resolved end-state. */
  previous: IAutoMovieBeatEndState;

  /** The incoming beat's resolved opening-state. */
  opening: IAutoMovieBeatEndState;

  /** World-space position drift tolerated (metres); defaults to 0.05. */
  positionTolerance?: number;

  /** Facing drift tolerated (degrees); defaults to 5. */
  facingToleranceDeg?: number;
}): IAutoMovieValidation => {
  const collector: ViolationCollector = new ViolationCollector();
  const tolerances: IAutoMovieContinuityTolerances | null =
    readContinuityTolerances(
      props.positionTolerance,
      props.facingToleranceDeg,
      "$input",
      collector,
    );
  if (tolerances === null) return collector.toValidation();
  compareContinuityBoundary(
    props.previous,
    props.opening,
    "$input",
    tolerances,
    collector,
  );
  return collector.toValidation();
};
