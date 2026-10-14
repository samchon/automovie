import { IAutoMovieFormationMotion } from "@automovie/interface";

import { IAutoMovieSampledFormationMotion } from "./IAutoMovieSampledFormationMotion";
import { lerp } from "./lerp";
import { ease } from "./motion/ease";

/**
 * Sample one formation's authored cue sequence at finite absolute seconds.
 * Matching cues sort by start and code-unit id; the first active cue wins.
 * Identity precedes the first cue, completed targets remain between cues and
 * reform progress survives cues without a new layout. A new layout starts at
 * the previous completed arrangement; the first starts at the design.
 * Retained translation,
 * spacing and layout records alias authored inputs and must be treated read-only.
 *
 * @evidence contracts/common.md#principled-implementation Start/id ordering, eased interpolation and completed-target retention form a deterministic cue state machine; a new layout retains the previous completed layout as fromLayout, while absence preserves design fallback. Finite times and admitted cue chronology are caller premises.
 * @evidence contracts/common.md#clear-and-simple-design Whole-formation placement and viewer sampling consume this state, while ease and scalar lerp own interpolation and slot exceptions use their separate sampler.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Cue identity only resolves deterministic ties; no actor-specific offsets or recovery state replace the caller's admitted chronology.
 * @evidence contracts/common.md#meaningful-documentation States seconds, matching order, first-active precedence, prior-completed-layout to new-layout continuity, design fallback and authored-record alias ownership.
 * @evidence contracts/performance.md#efficient-algorithms Every query scans M input cues, sorts C matching cues in O(C log C), then visits at most C states, using O(C) selection storage rather than constant sparse lookup.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Current source cues are filtered and sorted per query; this owner retains no index whose validity would depend on mutable choreography.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The temporary selection array is released on return; retained states alias authored channel/layout records, while active interpolation owns its new numeric channel records.
 */
export const sampleFormationMotion: (
  motions: readonly IAutoMovieFormationMotion[],
  formation: string,
  time: number,
) => IAutoMovieSampledFormationMotion = (
  motions: readonly IAutoMovieFormationMotion[],
  formation: string,
  time: number,
): IAutoMovieSampledFormationMotion => {
  const cues: IAutoMovieFormationMotion[] = motions
    .filter(
      (cue: IAutoMovieFormationMotion): boolean => cue.formation === formation,
    )
    .sort(
      (
        left: IAutoMovieFormationMotion,
        right: IAutoMovieFormationMotion,
      ): number =>
        left.start - right.start ||
        (left.id < right.id ? -1 : left.id > right.id ? 1 : 0),
    );
  const identity: IAutoMovieSampledFormationMotion = {
    translation: { x: 0, y: 0, z: 0 },
    facingOffsetDeg: 0,
    spacingScale: { lateral: 1, depth: 1 },
    reform: null,
  };
  if (cues.length === 0 || time < cues[0]!.start) return identity;
  // The arrangement the unit is standing in before the next cue moves it: the
  // target of the last cue that finished, held at one, so a unit that
  // re-formed stays re-formed instead of snapping back the moment its cue ends.
  let retained: IAutoMovieSampledFormationMotion = {
    ...cues[0]!.from,
    reform: null,
  };
  for (const cue of cues) {
    if (time < cue.start) return retained;
    if (time < cue.end) {
      const progress: number = ease(
        cue.easing,
        Math.max(0, Math.min(1, (time - cue.start) / (cue.end - cue.start))),
      );
      return {
        translation: {
          x: lerp(cue.from.translation.x, cue.to.translation.x, progress),
          y: lerp(cue.from.translation.y, cue.to.translation.y, progress),
          z: lerp(cue.from.translation.z, cue.to.translation.z, progress),
        },
        facingOffsetDeg: lerp(
          cue.from.facingOffsetDeg,
          cue.to.facingOffsetDeg,
          progress,
        ),
        spacingScale: {
          lateral: lerp(
            cue.from.spacingScale.lateral,
            cue.to.spacingScale.lateral,
            progress,
          ),
          depth: lerp(
            cue.from.spacingScale.depth,
            cue.to.spacingScale.depth,
            progress,
          ),
        },
        reform:
          cue.layout === undefined
            ? retained.reform
            : {
                ...(retained.reform === null
                  ? {}
                  : { fromLayout: retained.reform.layout }),
                layout: cue.layout,
                progress,
              },
      };
    }
    retained = {
      ...cue.to,
      reform:
        cue.layout === undefined
          ? retained.reform
          : {
              ...(retained.reform === null
                ? {}
                : { fromLayout: retained.reform.layout }),
              layout: cue.layout,
              progress: 1,
            },
    };
  }
  return retained;
};
