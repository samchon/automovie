import { IAutoMovieBuiltElement } from "@automovie/interface";

/**
 * The ids of some elements and of every element below them through `parent`
 * links.
 *
 * The roots are always included, even when no declared element carries them, so
 * the caller decides whether an undeclared root is an error. A parent cycle in
 * an unvalidated record terminates, because each id enters the set once. The
 * set's iteration order is breadth-first discovery order from the roots in the
 * order given.
 *
 * @param elements Every element of one environment.
 * @param roots Element ids to start from.
 * @returns The roots and all their descendants.
 */
export const builtElementSubtree: (
  elements: readonly IAutoMovieBuiltElement[],
  roots: readonly string[],
) => Set<string> = (
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
