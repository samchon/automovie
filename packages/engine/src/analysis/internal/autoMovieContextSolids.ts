import {
  type IAutoMovieAnalysisSolid,
  IAutoMovieContextOccluder,
  IAutoMovieEnvironmentContext,
} from "@automovie/interface";

/*
 * Every context occluder as an analysis solid.
 *
 * Keeps context order, copies each id and references (does not copy) each
 * occluder's plane array, dropping the occluder's `kind`. It validates nothing;
 * `analyzeAutoMovieDaylight` validates the whole context before calling it.
 * Parameter context: Environment context whose occluders become solids.
 * Returns: A new array of `{ id, planes }` records, one per occluder.
 */
export function autoMovieContextSolids(
  context: IAutoMovieEnvironmentContext,
): IAutoMovieAnalysisSolid[] {
  return context.occluders.map(
    (occluder: IAutoMovieContextOccluder): IAutoMovieAnalysisSolid => ({
      id: occluder.id,
      planes: occluder.planes,
    }),
  );
}
