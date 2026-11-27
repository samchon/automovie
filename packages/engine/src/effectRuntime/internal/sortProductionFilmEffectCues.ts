import { IAutoMovieFilmTimeline } from "@automovie/interface";

import { AutoMovieEngineText } from "../../text/AutoMovieEngineText";

/**
 * Order film effect cues by start frame, then by code-unit cue id.
 *
 * This is the one order a runtime population is written in and verified
 * against. The materializer and the population verifier both read it here, so
 * the order a builder persists cannot drift from the order a consumer checks.
 * Integer frames and code units decide it, so neither host sort nor locale can
 * reorder a runtime. The input array is left untouched; a new array is
 * returned.
 */
export const sortProductionFilmEffectCues = (
  cues: IAutoMovieFilmTimeline["tracks"]["effects"],
): IAutoMovieFilmTimeline["tracks"]["effects"] =>
  [...cues].sort(
    (left: FilmEffectCue, right: FilmEffectCue): number =>
      left.startFrame - right.startFrame ||
      AutoMovieEngineText.compareCodeUnits(left.id, right.id),
  );

type FilmEffectCue = IAutoMovieFilmTimeline["tracks"]["effects"][number];
