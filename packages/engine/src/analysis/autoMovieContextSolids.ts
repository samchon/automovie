import {
  IAutoMovieContextOccluder,
  IAutoMovieEnvironmentContext,
} from "@automovie/interface";

import { IAutoMovieAnalysisSolid } from "./IAutoMovieAnalysisSolid";

/**
 *
 * Every context occluder as an analysis solid.
 *
 * Keeps context order, copies each id and references (does not copy) each
 * occluder's plane array. It validates nothing; `analyzeAutoMovieDaylight`
 * validates the whole context before calling it.
 *
 * @evidence contracts/common.md#principled-implementation A structural projection of `IAutoMovieContextOccluder` onto `IAutoMovieAnalysisSolid` keeping id and planes, so the same slab test applies to neighbouring masses and to building shades.
 * @evidence contracts/common.md#clear-and-simple-design Lives apart from the analyzer so the occluder-to-solid mapping has one owner; the daylight analyzer is its only caller in the engine.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Drops and adds no occluder, and the returned list stays separate from the shades, so a context mass is never reported as building geometry.
 * @evidence contracts/common.md#meaningful-documentation States the preserved order, the shared plane arrays, and that validation is the caller's job.
 * @evidenceExclude contracts/performance.md#cost-and-resources One map over occluders allocating a two-field record each, with no algorithm to choose. Called once per daylight study, and the analyzer shares the resulting list across every ray of that study. Returns a new array whose records reference the context's plane arrays, and keeps nothing itself.
 * @author Samchon
 */
export const autoMovieContextSolids = (
  context: IAutoMovieEnvironmentContext,
): IAutoMovieAnalysisSolid[] =>
  context.occluders.map((occluder: IAutoMovieContextOccluder) => ({
    id: occluder.id,
    planes: occluder.planes,
  }));
