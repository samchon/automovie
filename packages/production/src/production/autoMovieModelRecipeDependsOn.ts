import type { IAutoMovieModelRecipe } from "@automovie/interface";

/**
 * Whether a model identity reaches a dependency through its LOD recipe edges.
 *
 * Project design mutation uses this relation to invalidate dependent assets,
 * formations and shots. Identity is reflexive even for an absent recipe: an
 * edit to that exact identity still affects references to it. Other absent
 * recipes contribute no outgoing edges. Self-reference is permitted, and a
 * cycle cannot manufacture reachability to an unrelated dependency.
 *
 * Depth-first traversal keeps an independent visited set on each branch,
 * preserving the existing mutation policy while leaving the acquired recipe
 * population unchanged. Only LOD references matter here; this neither builds
 * geometry nor validates a recipe, and the design validator owns malformed
 * references. A changed result changes the mutation's stale review population.
 */
export const autoMovieModelRecipeDependsOn = (
  recipes: ReadonlyMap<string, Pick<IAutoMovieModelRecipe, "lod">>,
  model: string,
  dependency: string,
): boolean => {
  const visit = (id: string, visited: ReadonlySet<string>): boolean => {
    if (id === dependency) return true;
    if (visited.has(id)) return false;
    const branch = new Set(visited).add(id);
    return (recipes.get(id)?.lod ?? []).some(
      (lod) => lod.recipe !== id && visit(lod.recipe, branch),
    );
  };
  return visit(model, new Set());
};
