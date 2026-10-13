import {
  IAutoMovieFilmTimeline,
  IAutoMovieProductionFrameRate,
} from "@automovie/interface";

import { resolveProductionFrameRate } from "../film/resolveProductionFrameRate";
import { AutoMovieFilmEffectRuntimeError } from "./AutoMovieFilmEffectRuntimeError";

/**
 * Resolve the timeline's exact rate for a film-effect question, or refuse it.
 *
 * A display `fps` that disagrees with the declared rational rate is refused as
 * invalid film-effect input, so no projection or verification runs against an
 * ambiguous clock.
 */
export const productionFilmEffectTimelineFrameRate = (
  timeline: Pick<IAutoMovieFilmTimeline, "fps" | "frameRate">,
): IAutoMovieProductionFrameRate => {
  try {
    return resolveProductionFrameRate(timeline);
  } catch {
    throw new AutoMovieFilmEffectRuntimeError(
      "film-effect-input-invalid",
      "Film effect timeline frame rate must be a consistent positive exact rational identity.",
    );
  }
};
