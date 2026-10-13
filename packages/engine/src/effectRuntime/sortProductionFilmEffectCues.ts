import { IAutoMovieFilmTimeline } from "@automovie/interface";

import { compareCodeUnits } from "../text/compareCodeUnits";

type FilmEffectCue = IAutoMovieFilmTimeline["tracks"]["effects"][number];

/**
 * Order film effect cues by start frame, then by code-unit cue id.
 *
 * This is the one order a runtime population is written in and verified
 * against. The materializer and the population verifier both read it here, so
 * the order a builder persists cannot drift from the order a consumer checks.
 * Integer frames and code units decide it, so neither host sort nor locale can
 * reorder a runtime. The input array is left untouched; a new array is
 * returned.
 *
 * @evidence contracts/common.md#principled-implementation A total order on (start frame, id) using integer subtraction and `compareCodeUnits`, which compares UTF-16 code units without locale collation, so `B` precedes `a` and the order is the same on every runtime; ids are unique in a valid track, so no two cues tie.
 * @evidence contracts/common.md#clear-and-simple-design A separate function only because two owners, the writer and the verifier, must apply the identical order; neither keeps its own comparator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No authored order or cue kind is privileged, and the caller's track order is not trusted as already canonical.
 * @evidence contracts/common.md#meaningful-documentation States the two sort keys, who depends on the order and why it is shared, why locale cannot change it, and that the input is not mutated.
 * @evidence contracts/performance.md#efficient-algorithms `O(C log C)` comparisons for C cues over one shallow copy of the array; the copy is needed so the timeline's own track keeps its authored order.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure ordering per call; the writer and verifier run in different processes over different timelines, so there is no shared result to reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a new array of references to the caller's cue records and retains nothing.
 */
export const sortProductionFilmEffectCues = (
  cues: IAutoMovieFilmTimeline["tracks"]["effects"],
): IAutoMovieFilmTimeline["tracks"]["effects"] =>
  [...cues].sort(
    (left: FilmEffectCue, right: FilmEffectCue): number =>
      left.startFrame - right.startFrame || compareCodeUnits(left.id, right.id),
  );
