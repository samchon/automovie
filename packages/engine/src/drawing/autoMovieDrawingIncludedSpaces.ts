import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieDrawingView,
} from "@automovie/interface";

/**
 * The logical spaces a view draws, descendants included, or `null` for all.
 *
 * An empty `view.spaces` filter means every space. Otherwise the named spaces
 * and every space below them in the space hierarchy are included, because a
 * view filtered to a storey means the rooms in it, and a filter that stopped at
 * the named record would draw an empty sheet for every building that partitions
 * its floors. A named space the design does not declare stays in the set and
 * selects nothing; the caller reports it as a gap.
 *
 * @param environment The validated design, whose space parents resolve and are
 *   acyclic.
 * @param view The view whose space filter applies.
 * @returns The included space ids, or `null` when the view does not filter.
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
