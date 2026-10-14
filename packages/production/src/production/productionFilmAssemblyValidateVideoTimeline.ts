import { IAutoMovieDiagnostic, IAutoMovieFilmTimeline, IAutoMovieProductionFrameRate, type IAutoMovieFilmTimelineSegment } from "@automovie/interface";

import type { IProductionFilmAssemblyProps } from "./IProductionFilmAssemblyProps";
import { filmDiagnostic } from "./filmDiagnostic";
import { productionFilmAssemblyTransitionDuration } from "./productionFilmAssemblyTransitionDuration";
import { productionFilmAssemblyValidateStateContinuity } from "./productionFilmAssemblyValidateStateContinuity";

/**
 * Append structural video-track errors for empty films, initial gaps, unsupported edge dissolves, insufficient handles, unmatched adjacent transitions, and discontinuous placement starts; adjacent state predicates are checked afterward.
 *
 * @evidence contracts/common.md#principled-implementation Ordered segments define the film grid. Dissolve overlap subtracts its duration from the prior end, fades and cuts remain contiguous, and transition lengths must fit the appropriate source handles or segment duration. Current typed segments and canonical frame rate are premises.
 * @evidence contracts/common.md#clear-and-simple-design The traversal keeps pairwise placement and transition rules together, delegating predicate continuity to its own helper after each adjacent placement check. It validates an assembled sequence rather than scheduling a renderer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The first segment must start at frame zero, dissolves require two neighbors, and mismatches append errors instead of inserting gaps, trimming handles, or changing transition kinds. No timeline repair or fixture exception is performed.
 * @evidence contracts/common.md#meaningful-documentation The comment lists ordering, film-edge and handle rules, caller-owned diagnostic effects, and the subsequent continuity check. It does not claim decoded frames or subjective editing quality are observed.
 * @evidence contracts/performance.md#efficient-algorithms The ordered traversal is linear in segments, plus canonical predicate encoding in continuity checks. It allocates diagnostics only for findings and borrows existing segments rather than copying the whole track.
 * @evidence contracts/performance.md#reuse-equivalent-work Normalized transition lengths and current contract/realization maps are reused within this sequence. Validity is recalculated for each draft because placement, source range, and neighboring states can differ.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns segments, props, and appended diagnostics; local neighboring references expire after the scan. No descriptor, renderer, worker, or persistent population is retained.
 */
export const productionFilmAssemblyValidateVideoTimeline: (segments: readonly IAutoMovieFilmTimeline["segments"][number][], props: IProductionFilmAssemblyProps, frameRate: IAutoMovieProductionFrameRate, diagnostics: IAutoMovieDiagnostic[]) => void = (
  segments: readonly IAutoMovieFilmTimeline["segments"][number][],
  props: IProductionFilmAssemblyProps,
  frameRate: IAutoMovieProductionFrameRate,
  diagnostics: IAutoMovieDiagnostic[],
): void => {
  if (segments.length === 0) {
    diagnostics.push(
      filmDiagnostic(
        "film-video-empty",
        "The finished film must contain at least one current video placement.",
      ),
    );
    return;
  }
  if (segments[0]!.startFrame !== 0)
    diagnostics.push(
      filmDiagnostic(
        "film-global-order-invalid",
        `The first video placement starts at frame ${segments[0]!.startFrame}; it must start at frame 0.`,
      ),
    );
  for (let index: number = 0; index < segments.length; ++index) {
    const segment: IAutoMovieFilmTimelineSegment = segments[index]!;
    if (
      (index === 0 && segment.transitionIn.kind === "dissolve") ||
      (index === segments.length - 1 &&
        segment.transitionOut.kind === "dissolve")
    )
      diagnostics.push(
        filmDiagnostic(
          "film-transition-invalid",
          `Shot "${segment.shot}" cannot dissolve beyond the beginning or end of the film.`,
        ),
      );
    for (const [side, transition, handle] of [
      ["incoming", segment.transitionIn, segment.headHandleFrames],
      ["outgoing", segment.transitionOut, segment.tailHandleFrames],
    ] as const)
      if (
        transition.kind !== "cut" &&
        productionFilmAssemblyTransitionDuration(transition) >
          (transition.kind === "dissolve"
            ? handle
            : segment.endFrame - segment.startFrame)
      )
        diagnostics.push(
          filmDiagnostic(
            "film-transition-handle-missing",
            `Shot "${segment.shot}" ${side} ${transition.kind} needs ${productionFilmAssemblyTransitionDuration(transition)} frames, but only ${handle} transition-handle frames are declared.`,
          ),
        );
    if (index === 0) continue;
    const previous: IAutoMovieFilmTimelineSegment = segments[index - 1]!;
    if (
      previous.transitionOut.kind !== segment.transitionIn.kind ||
      productionFilmAssemblyTransitionDuration(previous.transitionOut) !==
        productionFilmAssemblyTransitionDuration(segment.transitionIn)
    )
      diagnostics.push(
        filmDiagnostic(
          "film-transition-mismatch",
          `Transition between "${previous.shot}" and "${segment.shot}" must have identical outgoing and incoming kind/duration.`,
        ),
      );
    const overlap: number =
      previous.transitionOut.kind === "dissolve"
        ? productionFilmAssemblyTransitionDuration(previous.transitionOut)
        : 0;
    const expectedStart: number = previous.endFrame - overlap;
    if (segment.startFrame !== expectedStart)
      diagnostics.push(
        filmDiagnostic(
          "film-global-order-invalid",
          `Shot "${segment.shot}" starts at frame ${segment.startFrame}; transition law requires frame ${expectedStart}. Arbitrary gaps and overlaps are forbidden.`,
        ),
      );
    productionFilmAssemblyValidateStateContinuity(previous, segment, props, frameRate, diagnostics);
  }
};
