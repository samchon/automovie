import {
  type IAutoMovieContinuityTolerances,
  type IAutoMovieValidateContinuity,
  IAutoMovieValidation,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { ViolationCollector } from "./ViolationCollector";
import { compareContinuityBoundary } from "./compareContinuityBoundary";
import { readContinuityTolerances } from "./readContinuityTolerances";

/**
 * Compare every prior-end actor to the incoming opening for missing presence, Euclidean drift, facing angle and persistent mount changes.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Compare every prior-end actor to the incoming opening for missing presence, Euclidean drift, facing angle and persistent mount changes.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pairwise owner appends advisory faults; tolerance admission precedes snapshot comparison.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only prior actors are required to persist; new incoming actors are allowed and drift warnings do not refuse an intentional cut.
 * @evidence contracts/development/common.md#meaningful-documentation Metre/degree tolerances default50mm/5deg and missing/mount warnings carry actor paths.
 * @evidence contracts/development/implementation.md#efficient-algorithms P prior actors and O opening actors require O(P+O) indexing/comparison plus id text.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The opening id map shares lookup work within this boundary, without caching mutable snapshots.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Snapshots are borrowed; only report rows escape and no film playback state is retained.
 */
export const validateContinuity: (
  props: IAutoMovieValidateContinuity.IProps,
) => IAutoMovieValidation = (
  props: IAutoMovieValidateContinuity.IProps,
): IAutoMovieValidation => {
  const collector: IAutoMovieViolationCollector = new ViolationCollector();
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
