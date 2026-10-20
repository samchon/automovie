import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieDrawingView,
} from "@automovie/interface";

/**
 * The logical spaces a view draws, descendants included, or `null` for all.
 *
 * An empty `view.spaces` filter means every space. Otherwise the named spaces
 * and every space below them in the space hierarchy are included, because a
 * view filtered to a storey means the rooms in it, and a filter that stopped
 * at the named record would draw an empty sheet for every building that
 * partitions its floors. A named space the design does not declare stays in
 * the set and selects nothing; the caller reports it as a gap.
 *
 * @param environment The validated design, whose space parents resolve and
 *   are acyclic.
 * @param view The view whose space filter applies.
 * @returns The included space ids, or `null` when the view does not filter.
 *
 * @evidence contracts/common.md#principled-implementation A breadth-first walk down a parent-to-children index from the named spaces, which reaches exactly the descendants because validation makes the space hierarchy a forest.
 * @evidence contracts/common.md#clear-and-simple-design One function owns the meaning of the view's space filter, and the drafter, the sectioner and the opening pass all read its one set.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No space or kind is special-cased; an undeclared filter name is kept and reported by the caller rather than silently dropped.
 * @evidence contracts/common.md#meaningful-documentation The comment states what an empty filter means, the descendant rule and why, what happens to an undeclared name, and the hierarchy premise.
 * @evidence contracts/performance.md#efficient-algorithms Builds the children index in one pass and visits each included space once, so time is linear in the space count, where a repeated fixpoint scan would be quadratic in the hierarchy depth.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Called once per derivation; the set it returns is shared by every stage of that derivation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The children index and queue are released on return, and the caller owns the returned set, bounded by the space count plus the filter's names.
 */
export const autoMovieDrawingIncludedSpaces = (
  environment: IAutoMovieBuiltEnvironment,
  view: IAutoMovieDrawingView,
): Set<string> | null => {
  if (view.spaces.length === 0) return null;
  const children: Map<string, string[]> = new Map();
  for (const space of environment.spaces) {
    if (space.parent === null) continue;
    const siblings: string[] | undefined = children.get(space.parent);
    if (siblings === undefined) children.set(space.parent, [space.id]);
    else siblings.push(space.id);
  }
  const included: Set<string> = new Set(view.spaces);
  const queue: string[] = [...included];
  for (let index: number = 0; index < queue.length; ++index)
    for (const child of children.get(queue[index]!) ?? [])
      if (!included.has(child)) {
        included.add(child);
        queue.push(child);
      }
  return included;
};
