import {
  IAutoMovieBeatEndState,
  type IAutoMovieContinuityTolerances,
  type IAutoMovieResolveBeatProps,
  type IAutoMovieValidateFilmContinuity,
  IAutoMovieValidation,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { resolveBeatEnd } from "../film/resolveBeatEnd";
import { resolveBeatOpening } from "../film/resolveBeatOpening";
import { ViolationCollector } from "./ViolationCollector";
import { compareContinuityBoundary } from "./compareContinuityBoundary";
import { readContinuityTolerances } from "./readContinuityTolerances";

/**
 * Resolve end/opening states in playback order and compare adjacent beat
 * boundaries for advisory discontinuity.
 */
export const validateFilmContinuity: (
  props: IAutoMovieValidateFilmContinuity.IProps,
) => IAutoMovieValidation = (
  props: IAutoMovieValidateFilmContinuity.IProps,
): IAutoMovieValidation => {
  const collector: IAutoMovieViolationCollector = new ViolationCollector();
  const tolerances: IAutoMovieContinuityTolerances | null =
    readContinuityTolerances(
      props.positionTolerance,
      props.facingToleranceDeg,
      "$input",
      collector,
    );
  if (tolerances === null || props.beats.length < 2)
    return collector.toValidation();

  const snapshots: {
    end: IAutoMovieBeatEndState;
    opening: IAutoMovieBeatEndState;
  }[] = props.beats.map(
    (
      beat: IAutoMovieResolveBeatProps,
    ): { end: IAutoMovieBeatEndState; opening: IAutoMovieBeatEndState } => ({
      end: resolveBeatEnd(beat),
      opening: resolveBeatOpening(beat),
    }),
  );
  for (let i: number = 1; i < snapshots.length; ++i)
    compareContinuityBoundary(
      snapshots[i - 1]!.end,
      snapshots[i]!.opening,
      `$input.beats[${i}]`,
      tolerances,
      collector,
    );
  return collector.toValidation();
};
