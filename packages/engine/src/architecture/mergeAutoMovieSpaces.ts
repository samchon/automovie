import { IAutoMovieSpace } from "@automovie/interface";

/**
 * Merge several subject-owned support spaces into one stage space.
 *
 * Surfaces and walkable ids are concatenated in input order under the new
 * `id`; the input spaces' own ids are dropped. Nothing is renamed or
 * deduplicated, so a surface id two inputs share appears twice and is refused
 * by `validateSpace` when the merged space is validated. The surface objects
 * are shared with the inputs, not copied.
 *
 * @param id Id of the merged stage space.
 * @param spaces Spaces whose surfaces and walkable ids are combined.
 * @evidence contracts/common.md#principled-implementation Concatenation preserves every input surface and walkable reference unchanged, which is all a stage space needs because walkable ids resolve by surface id and surfaces keep their own geometry.
 * @evidence contracts/common.md#clear-and-simple-design A single `flatMap` per field with no conflict policy, leaving id-collision refusal to `validateSpace`, which already owns that rule for every space.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither renames colliding ids nor drops duplicates, so a collision surfaces as a validation error instead of being hidden; no subject or surface is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the input-order concatenation, the dropped input ids, the absence of deduplication and where a collision is caught, and the shared surface references.
 * @evidence contracts/performance.md#cost-and-resources One linear pass per field over all input surfaces and walkable ids, allocating only the two output arrays; nothing is cached, and the result keeps references to the callers' surface objects for as long as the caller holds it.
 */
export const mergeAutoMovieSpaces = (
  id: string,
  spaces: readonly IAutoMovieSpace[],
): IAutoMovieSpace => ({
  id,
  surfaces: spaces.flatMap((space) => space.surfaces),
  walkable: spaces.flatMap((space) => space.walkable),
});
