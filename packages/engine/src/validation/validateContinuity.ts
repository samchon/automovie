import {
  type IAutoMovieContinuityTolerances,
  type IAutoMovieValidateContinuity,
  IAutoMovieValidation,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { AutoMovieEngineViolationCollector } from "./AutoMovieEngineViolationCollector";
import { compareContinuityBoundary } from "./compareContinuityBoundary";
import { readContinuityTolerances } from "./readContinuityTolerances";

/**
 * Compare every prior-end actor to the incoming opening for missing presence,
 * Euclidean drift, facing angle and persistent mount changes.
 */
export function validateContinuity(
  props: IAutoMovieValidateContinuity.IProps,
): IAutoMovieValidation {
  const collector: IAutoMovieViolationCollector = new AutoMovieEngineViolationCollector();
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
}
