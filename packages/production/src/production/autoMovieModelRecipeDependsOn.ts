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
 * Iterative depth-first traversal visits each reachable identity once, without
 * growing the JavaScript call stack or repeating shared DAG paths. Only LOD
 * references matter here; this neither builds
 * geometry nor validates a recipe, and the design validator owns malformed
 * references. A changed result changes the mutation's stale review population.
 *
 * @evidence contracts/common.md#principled-implementation Directed reachability uses an explicit work stack and one visited set; equality is tested before expansion so exact and dangling dependency identities remain reflexive, while cycles cannot create unrelated reachability.
 * @evidence contracts/common.md#clear-and-simple-design Project mutation calls one LOD-dependency owner for model, formation and shot consequences; recipe admission and geometry construction remain separate responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No branch-copy workaround repeats shared subgraphs, finite reachable graphs do not depend on native recursion depth and missing recipes add no invented outgoing edges.
 * @evidence contracts/common.md#meaningful-documentation States reflexive absent identity, transitive LOD-only semantics, cycle handling, nonmutation and consequence ownership.
 * @evidence contracts/performance.md#efficient-algorithms For V reachable identities and E reachable LOD edges, each identity expands once for O(V+E) visits and O(V+E) worst-case pending/visited storage; the explicit stack avoids call-stack failure and repeated exponential DAG paths.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each mutation query reads its current graph; within the query visited identities share completed expansion, without retaining a cross-mutation result for edited LOD edges.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Stack and visited ids belong to one call and release on return, bounded by reachable graph population rather than a fixed cap; recipes are borrowed unchanged and no handle or task is acquired.
 */
export function autoMovieModelRecipeDependsOn(
  recipes: ReadonlyMap<string, Pick<IAutoMovieModelRecipe, "lod">>,
  model: string,
  dependency: string,
): boolean {
  const visited: Set<string> = new Set<string>();
  const pending: string[] = [model];
  while (pending.length !== 0) {
    const id: string = pending.pop()!;
    if (id === dependency) return true;
    if (visited.has(id)) continue;
    visited.add(id);
    for (const lod of recipes.get(id)?.lod ?? [])
      if (!visited.has(lod.recipe)) pending.push(lod.recipe);
  }
  return false;
}
