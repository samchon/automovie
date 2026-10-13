import {
  IAutoMovieContextOccluder,
  IAutoMovieEnvironmentContext,
} from "@automovie/interface";

import { IAutoMovieAnalysisSolid } from "./IAutoMovieAnalysisSolid";

/**
 * Every context occluder as an analysis solid.
 *
 * Keeps context order, copies each id and references (does not copy) each
 * occluder's plane array. It validates nothing; `analyzeAutoMovieDaylight`
 * validates the whole context before calling it.
 *
 * @author Samchon
 */
export const autoMovieContextSolids = (
  context: IAutoMovieEnvironmentContext,
): IAutoMovieAnalysisSolid[] =>
  context.occluders.map((occluder: IAutoMovieContextOccluder) => ({
    id: occluder.id,
    planes: occluder.planes,
  }));
