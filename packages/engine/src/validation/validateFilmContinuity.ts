import {
  IAutoMovieBeatEndState,
  IAutoMovieValidation,
} from "@automovie/interface";

import { IResolveBeatProps } from "../film/IResolveBeatProps";
import { resolveBeatEnd } from "../film/resolveBeatEnd";
import { resolveBeatOpening } from "../film/resolveBeatOpening";
import { IAutoMovieContinuityTolerances } from "./IAutoMovieContinuityTolerances";
import { ViolationCollector } from "./ViolationCollector";
import { compareContinuityBoundary } from "./compareContinuityBoundary";
import { readContinuityTolerances } from "./readContinuityTolerances";

/**
 * Resolve end/opening states in playback order and compare adjacent beat boundaries for advisory discontinuity.
 *
 * @evidence contracts/common.md#principled-implementation Resolve end/opening states in playback order and compare adjacent beat boundaries for advisory discontinuity.
 * @evidence contracts/common.md#clear-and-simple-design The film coordinator uses the same tolerance and boundary policies as pairwise continuity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero/singleton films return after tolerance admission without resolving unused snapshots; explicit invalid tolerances remain errors.
 * @evidence contracts/common.md#meaningful-documentation Ordered beats,50mm/5deg defaults and advisory missing/mount/drift outputs are stated.
 * @evidence contracts/performance.md#efficient-algorithms For B>=2, beat resolution plus actor indexing/comparison per cut dominates and all B snapshots remain live during the call; no-cut input performs only tolerance admission.
 * @evidence contracts/performance.md#reuse-equivalent-work Middle beat rows supply their opening to the incoming cut and their end to the outgoing cut; first-opening and last-end states are still resolved but unused. No snapshot is cached across mutable film inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Resolution inputs are borrowed; snapshots/maps release after validation while diagnostics transfer to the caller.
 */
export const validateFilmContinuity: (props: {
  beats: readonly IResolveBeatProps[];
  positionTolerance?: number;
  facingToleranceDeg?: number;
}) => IAutoMovieValidation = (props: {
  /** The film's beats, in playback order. */
  beats: readonly IResolveBeatProps[];

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
  if (tolerances === null || props.beats.length < 2)
    return collector.toValidation();

  const snapshots: {
    end: IAutoMovieBeatEndState;
    opening: IAutoMovieBeatEndState;
  }[] = props.beats.map(
    (
      beat: IResolveBeatProps,
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
