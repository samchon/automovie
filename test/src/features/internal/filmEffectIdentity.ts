import { IAutoMovieFilmTimeline } from "@automovie/interface";

import { IAutoMovieFilmEffectCurrentIdentity } from "@automovie/engine";
import { productionFilmEffectEditFingerprint } from "@automovie/engine";

/** Build the existing production/film/compile identity from a timeline and compute its executable edit fingerprint through the real engine owner. This supplies the identity consumed by the effect cases, not an independent fingerprint oracle. */
export const filmEffectIdentity: (
  timeline: IAutoMovieFilmTimeline,
) => IAutoMovieFilmEffectCurrentIdentity = (
  timeline: IAutoMovieFilmTimeline,
): IAutoMovieFilmEffectCurrentIdentity => ({
  production: "production",
  film: timeline.id,
  compileFingerprint: timeline.inputFingerprint,
  editFingerprint: productionFilmEffectEditFingerprint(timeline),
});
