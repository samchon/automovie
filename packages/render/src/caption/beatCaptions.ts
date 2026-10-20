import type {
  IAutoMovieScript,
  IAutoMovieScriptNode,
} from "@automovie/interface";

import { screenplaySceneSlug } from "../screenplay/screenplaySceneSlug";
import type { IAutoMovieBeatCaption } from "./IAutoMovieBeatCaption";

/**
 * Index each beat's caption and enclosing scene slug from the screenplay tree,
 * keyed by beat id: the join table `planCaptionSidecar` consults per span.
 *
 * The walk is depth-first from every root node, children in declaration order,
 * carrying the nearest scene slug down. A script whose `tree` is null or
 * absent, or a tree with no root, yields an empty map, so every span captions
 * null. A node unreachable from a root is never visited, and a beat id that
 * appears on two beat nodes keeps the later visit; commit validation refuses
 * both shapes, so neither reaches a committed script.
 *
 * @evidence contracts/common.md#principled-implementation An adjacency map from parent id to children turns the parent-pointer node list into a tree the walk visits once per reachable node, and the slug is passed down as a parameter so a scene's slug scopes exactly its subtree; the walk relies on commit validation's acyclic, unique-id tree, without which a node whose id equals its own parent would recurse forever.
 * @evidence contracts/common.md#clear-and-simple-design One function builds the adjacency map and the index together because no other caption consumer needs the adjacency; the scene slug comes from `screenplaySceneSlug` so the caption label and the screenplay heading cannot diverge, and the same parent-map walk is written again in `renderScreenplay`, a duplication this function does not own.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Both null and absent `tree` values are the interface's documented treeless states, not a fixture case, and the function never repairs an invalid tree; it leaves rejection to commit validation.
 * @evidence contracts/common.md#meaningful-documentation The doc names the consumer and key, the walk order and slug inheritance, what a treeless script yields, and what happens to an unreachable node or a repeated beat id.
 * @evidence contracts/performance.md#efficient-algorithms Time and space are linear in the node count N: one pass builds the adjacency map and the walk visits each reachable node once with a constant-time slug format per scene, which is the minimum for reading every beat.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The function computes one fresh index per call for one script and coordinates no phases; `planCaptionSidecar` calls it once per plan.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The adjacency map is local and released on return, and the returned map, owned by the caller, holds one record per distinct beat id, bounded by the tree's beat count; recursion depth is bounded by the tree's depth.
 */
export const beatCaptions: (
  script: IAutoMovieScript,
) => Map<string, IAutoMovieBeatCaption> = (
  script: IAutoMovieScript,
): Map<string, IAutoMovieBeatCaption> => {
  const map: Map<string, IAutoMovieBeatCaption> = new Map();
  const tree: IAutoMovieScriptNode[] | null | undefined = script.tree;
  if (tree === undefined || tree === null) return map;

  const children: Map<string | null, IAutoMovieScriptNode[]> = new Map();
  for (const node of tree) {
    const list: IAutoMovieScriptNode[] = children.get(node.parent) ?? [];
    list.push(node);
    children.set(node.parent, list);
  }

  const walk: (node: IAutoMovieScriptNode, slug: string | null) => void = (
    node: IAutoMovieScriptNode,
    slug: string | null,
  ): void => {
    const current: string | null =
      node.kind === "scene" ? screenplaySceneSlug(node.payload) : slug;
    if (node.kind === "beat")
      map.set(node.payload.beat, {
        caption: node.payload.caption,
        slug: current,
      });
    for (const child of children.get(node.id) ?? []) walk(child, current);
  };
  for (const root of children.get(null) ?? []) walk(root, null);
  return map;
};
