import { IAutoMovieCameraAction } from "@automovie/interface";

import { AutoMovieEngineFramingHeightFraction } from "./AutoMovieEngineFramingHeightFraction";

/**
 * Every member of the closed camera framing union, for gating values that
 * arrive from authored JSON at runtime.
 *
 * Taken from the keys of {@link AutoMovieEngineFramingHeightFraction}, whose record type
 * requires exactly one entry per framing, so a framing added to the interface
 * union fails compilation there instead of being refused here.
 */
export const AutoMovieEngineCameraFramings: ReadonlySet<IAutoMovieCameraAction["framing"]> =
  new Set(
    Object.keys(AutoMovieEngineFramingHeightFraction) as IAutoMovieCameraAction["framing"][],
  );
