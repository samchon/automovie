import { IAutoMovieBuiltSpace } from "@automovie/interface";

/**
 * The ids of one space and of every space below it through `parent` links.
 *
 * The containment fold the space queries share: a storey contains what its
 * rooms contain, at any depth. The root id is always included, even when no
 * declared space carries it, so the caller decides whether an undeclared root
 * is an error. The set's iteration order is breadth-first discovery order;
 * callers that publish the population sort it.
 */
export function builtSpaceSubtree(
  spaces: readonly IAutoMovieBuiltSpace[],
  root: string,
): Set<string> {
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
}
