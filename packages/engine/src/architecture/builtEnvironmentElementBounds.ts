import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieSubjectBox,
} from "@automovie/interface";

import { unionSubjectBoxes } from "../film/unionSubjectBoxes";
import { builtEnvironmentElementPartBounds } from "./builtEnvironmentElementPartBounds";

/**
 * The world box one named element's placed geometry fills.
 *
 * Placement resolution ({@link builtEnvironmentPlacementBounds}) and subject
 * description answer "where is this element" through this query rather than a
 * probe of their own, because a second probe is a second answer to one
 * question. The box is the union of {@link builtEnvironmentElementPartBounds},
 * so it is measured where the environment's current operating state puts the
 * element, from the vertices the renderer draws: `tessellate` for a
 * primitive and the stated mesh otherwise.
 *
 * `null` has two ordinary readings, and neither is a fault. An id this record
 * never declared resolves to nothing, because the caller is usually resolving a
 * locator that project source authored and an unresolved locator is a finding
 * for that caller to report rather than an engine refusal, which is why this
 * answers `null` where the space queries such as
 * {@link builtEnvironmentSpaceContentBounds} throw. A transform-only element
 * draws nothing, so it has no geometry box either: a grouping node standing
 * eight metres up is not something a camera can be aimed at.
 *
 * An element citing a runtime model reference, whose bytes this record never
 * holds, or whose parts draw no vertex, answers a degenerate box at its own
 * world origin rather than nothing, because that is the place the record does
 * state.
 *
 * One call stages the whole work's transform hierarchy, because an element's
 * world matrix is its ancestors' product. A caller resolving many elements of
 * one environment reads {@link builtEnvironmentPartBoxes} once instead.
 *
 * @evidence contracts/common.md#principled-implementation The union of an element's exact part boxes is the exact box of every vertex it draws, so the answer is read from the part query rather than measured a second way.
 * @evidence contracts/common.md#clear-and-simple-design Composes the part query with the shared box union, so element staging, tessellation and the null rules each have one owner and this query adds only the union.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no element or caller; both `null` readings and the origin fallback are the part query's stated rules, passed through unchanged.
 * @evidence contracts/common.md#meaningful-documentation States who reads this query, the operating state and vertices measured, both `null` readings and why they are not refusals, the origin fallback, and the whole-hierarchy cost per call with the batch alternative.
 * @evidence contracts/performance.md#efficient-algorithms Costs the part query, linear in the element count plus the element's vertex count, and one fold over its part boxes.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Answers one element over the caller's mutable record and caches nothing; building-wide reuse is `builtEnvironmentPartBoxes`.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Keeps nothing after returning; the caller owns the one returned box.
 * @author Samchon
 */
export const builtEnvironmentElementBounds = (
  environment: IAutoMovieBuiltEnvironment,
  elementId: string,
): IAutoMovieSubjectBox | null => {
  const parts: IAutoMovieSubjectBox[] | null =
    builtEnvironmentElementPartBounds(environment, elementId);
  return parts === null ? null : unionSubjectBoxes(parts);
};
