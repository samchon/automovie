import { IAutoMovieBuiltEnvironment } from "@automovie/interface";

import { compareAutoMovieRenderIds } from "../render/compareAutoMovieRenderIds";
import { builtSpaceSubtree } from "./builtSpaceSubtree";
import { requireBuiltSpace } from "./requireBuiltSpace";

/**
 * Every logical space under one space, including that space itself.
 *
 * The containment fold the space queries perform, published so a caller asking what a storey holds, what a building unit owns, or which rooms a derived review population must charge for uses this walk instead of rewriting it, because two walks over one hierarchy are two answers that eventually disagree.
 *
 * Membership follows `parent` links at any depth. Sorted in code-unit order, because a population is compared and printed rather than only tested for membership. Throws for an undeclared space id.
 *
 * @evidence contracts/common.md#principled-implementation Sorts the shared breadth-first subtree with `compareAutoMovieRenderIds`, the engine's code-unit id order, so the published population is independent of authored and discovery order.
 * @evidence contracts/common.md#clear-and-simple-design A sorted, refusing wrapper over `builtSpaceSubtree`, the same walk the containment, fidelity and content queries read, so every answer folds one hierarchy the same way.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no space; an undeclared id is refused rather than answered with an empty subtree that would read as a real room containing nothing.
 * @evidence contracts/common.md#meaningful-documentation States that the root is included, that membership follows `parent` links at any depth, why the list is code-unit sorted, why the walk is published, and the throw.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the space count for the walk plus k log k to sort the k members of the subtree.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Recomputed per call from the caller's mutable record; no cached population could prove it still matches the hierarchy.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Keeps nothing after returning; the caller owns the sorted id list, bounded by the space count.
 */
export const builtEnvironmentDescendantSpaces: (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
) => string[] = (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): string[] => {
  requireBuiltSpace(environment, spaceId);
  return [...builtSpaceSubtree(environment.spaces, spaceId)].sort(
    compareAutoMovieRenderIds,
  );
};
