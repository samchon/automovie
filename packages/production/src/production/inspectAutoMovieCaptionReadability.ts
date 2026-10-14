import type {
  IAutoMovieCaptionReadabilityProfile,
  IAutoMovieCaptionReadabilityReport,
  IAutoMovieFilmTimeline,
} from "@automovie/interface";
import { inspectAutoMovieCaptionReadabilityWithRuntime } from "@automovie/render";

import { autoMovieCaptionReadabilityRuntime } from "./autoMovieCaptionReadabilityRuntime";

/**
 * Measure canonical caption cues with the resident Node grapheme runtime.
 *
 * Production inspection passes the exact timeline and production-owned language
 * profiles. The render inspector owns threshold evaluation; this adapter owns
 * only the runtime that earns a measurement. Missing profiles retain measured
 * facts with `not-run`. Unsupported segmentation is also `not-run`, and the
 * resident identity never substitutes for it to produce a verdict. Neither
 * timeline nor profile records are mutated or published by this adapter.
 *
 * @evidence contracts/common.md#principled-implementation The resident grapheme capability earns text measurements and the render inspector applies only explicitly production-owned language thresholds; absent profiles or unsupported segmentation remain not-run rather than invented pass/fail.
 * @evidence contracts/common.md#clear-and-simple-design Production supplies the canonical timeline and runtime identity, while the render owner alone measures cue populations and interprets readability profiles.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No native runtime identity substitutes for an unsupported segmentation capability and no default threshold certifies a language without an authored profile.
 * @evidence contracts/common.md#meaningful-documentation States canonical inputs, runtime ownership, delegated thresholds, not-run states and lack of publication effects.
 * @evidence contracts/performance.md#efficient-algorithms Total work includes render inspection over caption cues/text/graphemes and language profile lookup; this adapter adds only one delegated call and neither duplicates segmentation nor hides its cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The current timeline/profile population is inspected directly; this wrapper retains no report cache or input-equivalence proof.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned report transfers cue measurements to the inspection caller; resident segmentation runtime owns its capability lifetime and the adapter acquires no filesystem handle or task.
 */
export function inspectAutoMovieCaptionReadability(
  timeline: IAutoMovieFilmTimeline,
  profiles: readonly IAutoMovieCaptionReadabilityProfile[],
): IAutoMovieCaptionReadabilityReport {
  return inspectAutoMovieCaptionReadabilityWithRuntime(
    timeline,
    profiles,
    autoMovieCaptionReadabilityRuntime,
  );
}
