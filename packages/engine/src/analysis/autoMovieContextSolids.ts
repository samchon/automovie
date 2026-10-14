import {
  IAutoMovieContextOccluder,
  IAutoMovieEnvironmentContext,
} from "@automovie/interface";

import { IAutoMovieAnalysisSolid } from "./IAutoMovieAnalysisSolid";

/**
 * Every context occluder as an analysis solid.
 *
 * Keeps context order, copies each id and references (does not copy) each
 * occluder's plane array, dropping the occluder's `kind`. It validates nothing;
 * `analyzeAutoMovieDaylight` validates the whole context before calling it.
 *
 * @param context Environment context whose occluders become solids.
 * @returns A new array of `{ id, planes }` records, one per occluder.
 *
 * @evidence contracts/common.md#principled-implementation A structural projection of `IAutoMovieContextOccluder` onto `IAutoMovieAnalysisSolid` that keeps id and planes, so the same slab test applies to neighbouring masses and to authored shades; the planes are shared by reference because neither the projection nor the ray test mutates them.
 * @evidence contracts/common.md#clear-and-simple-design One mapping function names the conversion so the daylight analyzer can concatenate context solids and shades without knowing the occluder record's other fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Drops and adds no occluder, and the returned list stays separate from the shades, so a context mass is never reported as building geometry.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the order, what is copied versus referenced, the dropped `kind`, and that validation is the caller's job.
 * @evidenceExclude contracts/performance.md#efficient-algorithms One map over the occluders allocating a two-field record each, with no algorithm or strategy to choose.
 * @evidence contracts/performance.md#reuse-equivalent-work Called once per daylight study, and the analyzer shares the resulting list across every ray of that study rather than rebuilding it per cell.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a new array of one record per occluder that references the context's plane arrays; the caller owns it, and this function keeps nothing.
 * @author Samchon
 */
export const autoMovieContextSolids: (context: IAutoMovieEnvironmentContext) => IAutoMovieAnalysisSolid[] = (
  context: IAutoMovieEnvironmentContext,
): IAutoMovieAnalysisSolid[] =>
  context.occluders.map(
    (occluder: IAutoMovieContextOccluder): IAutoMovieAnalysisSolid => ({
      id: occluder.id,
      planes: occluder.planes,
    }),
  );
