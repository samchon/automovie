import { IAutoMovieBuiltElement } from "@automovie/interface";

/**
 * The ids of some elements and of every element below them through `parent`
 * links.
 *
 * The roots are always included, even when no declared element carries them,
 * so the caller decides whether an undeclared root is an error. A parent cycle
 * in an unvalidated record terminates, because each id enters the set once.
 * The set's iteration order is breadth-first discovery order from the roots in
 * the order given.
 *
 * @param elements Every element of one environment.
 * @param roots Element ids to start from.
 * @returns The roots and all their descendants.
 *
 * @evidence contracts/common.md#principled-implementation A breadth-first walk over a parent-to-children index built in one pass, the standard traversal of a forest given by parent pointers; the visited set makes it total on cyclic input.
 * @evidence contracts/common.md#clear-and-simple-design The element counterpart of `builtSpaceSubtree`, shared by the opening and connector operation checks and the staged-configuration check, which previously each rescanned every element until nothing changed.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No element or kind is special-cased, and undeclared roots are returned rather than refused because refusal belongs to the caller that resolved them.
 * @evidence contracts/common.md#meaningful-documentation The documentation states that roots are included even when undeclared, the cycle behavior, and the iteration order.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the element count: one pass builds the child index and the walk visits each reachable element once, replacing a fixed-point rescan whose cost grew with hierarchy depth times element count.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Recomputed per call from the given array, because the element list is the caller's record and callers ask from different roots.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The child index and queue are released on return; the caller owns the returned set, bounded by the element count plus the undeclared roots.
 */
export const builtElementSubtree = (
  elements: readonly IAutoMovieBuiltElement[],
  roots: readonly string[],
): Set<string> => {
  const children: Map<string, string[]> = new Map();
  for (const element of elements) {
    if (element.parent === null) continue;
    const siblings: string[] | undefined = children.get(element.parent);
    if (siblings === undefined) children.set(element.parent, [element.id]);
    else siblings.push(element.id);
  }
  const included: Set<string> = new Set(roots);
  const queue: string[] = [...included];
  for (let index: number = 0; index < queue.length; ++index)
    for (const child of children.get(queue[index]!) ?? [])
      if (!included.has(child)) {
        included.add(child);
        queue.push(child);
      }
  return included;
};
