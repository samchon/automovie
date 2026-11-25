import { IAutoMovieSpace, IAutoMovieSurface } from "@automovie/interface";

/**
 * Merge several subject-owned support spaces into one stage space.
 *
 * Surfaces and walkable ids are concatenated in input order under the new `id`;
 * the input spaces' own ids are dropped. Nothing is renamed or deduplicated, so
 * a surface id two inputs share appears twice and is refused by `validateSpace`
 * when the merged space is validated. The surface objects are shared with the
 * inputs, not copied.
 *
 * @param id Id of the merged stage space.
 * @param spaces Spaces whose surfaces and walkable ids are combined.
 * @returns A new stage space holding every input's surfaces and walkable ids.
 */
export const mergeAutoMovieSpaces: (
  id: string,
  spaces: readonly IAutoMovieSpace[],
) => IAutoMovieSpace = (
  id: string,
  spaces: readonly IAutoMovieSpace[],
): IAutoMovieSpace => ({
  id,
  surfaces: spaces.flatMap(
    (space: IAutoMovieSpace): IAutoMovieSurface[] => space.surfaces,
  ),
  walkable: spaces.flatMap(
    (space: IAutoMovieSpace): string[] => space.walkable,
  ),
});
