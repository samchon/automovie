import { IAutoMovieSpace, IAutoMovieSurface } from "@automovie/interface";

/**
 * Merge several subject-owned support spaces into one stage space.
 *
 * Surfaces and walkable ids are concatenated in input order under the new `id`; the input spaces' own ids are dropped. Nothing is renamed or deduplicated, so a surface id two inputs share appears twice and is refused by `validateSpace` when the merged space is validated. The surface objects are shared with the inputs, not copied.
 *
 * @param id Id of the merged stage space.
 * @param spaces Spaces whose surfaces and walkable ids are combined.
 * @returns A new stage space holding every input's surfaces and walkable ids.
 *
 * @evidence contracts/common.md#principled-implementation Order-preserving concatenation of both lists, so each input's own surface and walkable order survives and the merged space is a pure function of the input order.
 * @evidence contracts/common.md#clear-and-simple-design Two `flatMap` concatenations and nothing else; conflicts are left to `validateSpace`, which owns that rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Renames, drops and deduplicates nothing, so a collision surfaces as a validation refusal instead of being hidden.
 * @evidence contracts/common.md#meaningful-documentation States the concatenation order, that input ids are dropped, that duplicates are kept and who refuses them, and that surfaces are shared, not copied.
 * @evidence contracts/performance.md#efficient-algorithms O(N + S + W) for N input spaces, S surfaces and W walkable ids: each flatMap visits every space even when its contributed list is empty.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure merge of its arguments that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the returned space's arrays are new and share the input surface objects.
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
