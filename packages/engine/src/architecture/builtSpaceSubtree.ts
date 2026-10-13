import { IAutoMovieBuiltSpace } from "@automovie/interface";

/**
 * The ids of one space and of every space below it through `parent` links.
 *
 * The containment fold the space queries share: a storey contains what its
 * rooms contain, at any depth. The root id is always included, even when no
 * declared space carries it, so the caller decides whether an undeclared root
 * is an error. The set's iteration order is breadth-first discovery order;
 * callers that publish the population sort it.
 *
 * @evidence contracts/common.md#principled-implementation A breadth-first walk over a parent-to-children index built in one pass, the standard traversal for a forest given by parent pointers; each id enters the set once, so a parent cycle in an unvalidated record terminates instead of looping.
 * @evidence contracts/common.md#clear-and-simple-design One walk shared by the descendant, containment, fidelity, building-owner and content-bounds queries, so a re-parented room is folded by the same rule in every answer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no space and treats every `parent` link alike; an undeclared root is returned as itself rather than refused here, because refusal belongs to the id-addressed queries.
 * @evidence contracts/common.md#meaningful-documentation States that the root is included even when undeclared, that membership follows `parent` links at any depth, and that iteration order is discovery order and not a sorted population.
 * @evidence contracts/performance.md#efficient-algorithms Time and space are linear in the declared space count: one pass builds the child index and the walk visits each reachable space once, replacing a fixed-point rescan whose cost grew with depth times count.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Recomputed per call from the given array; the space list is the caller's mutable record, so no cached subtree could prove it still matches.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates the child index and queue for one call and drops them on return; the caller owns the returned set, bounded by the space count.
 */
export const builtSpaceSubtree = (
  spaces: readonly IAutoMovieBuiltSpace[],
  root: string,
): Set<string> => {
  const children: Map<string, string[]> = new Map();
  for (const space of spaces) {
    if (space.parent === null) continue;
    const siblings: string[] | undefined = children.get(space.parent);
    if (siblings === undefined) children.set(space.parent, [space.id]);
    else siblings.push(space.id);
  }
  const included: Set<string> = new Set([root]);
  const queue: string[] = [root];
  for (let index: number = 0; index < queue.length; ++index)
    for (const child of children.get(queue[index]!) ?? [])
      if (!included.has(child)) {
        included.add(child);
        queue.push(child);
      }
  return included;
};
