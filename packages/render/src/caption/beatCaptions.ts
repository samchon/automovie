import type {
  IAutoMovieScript,
  IAutoMovieScriptNode,
} from "@automovie/interface";

import { screenplaySceneSlug } from "../screenplay/screenplaySceneSlug";
import type { IAutoMovieBeatCaption } from "./IAutoMovieBeatCaption";

/**
 * Per-beat caption + enclosing scene slug from the screenplay tree: the join
 * table {@link planCaptionSidecar} consults per span. The tree walks depth-first
 * from the intent root (the same walk the screenplay document renders with),
 * carrying the nearest scene slug down; a treeless script (null or the legacy
 * absent field), or a tree with no root to walk, yields an empty map, so every
 * span captions `null`. A node unreachable from the root is never visited:
 * commit validation owns that rejection, the join is total.
 *
 * @author Samchon
 */
export const beatCaptions = (
  script: IAutoMovieScript,
): Map<string, IAutoMovieBeatCaption> => {
  const map = new Map<string, IAutoMovieBeatCaption>();
  const tree = script.tree;
  if (tree === undefined) return map;
  if (tree === null) return map;

  const children = new Map<string | null, IAutoMovieScriptNode[]>();
  for (const node of tree) {
    const list = children.get(node.parent) ?? [];
    list.push(node);
    children.set(node.parent, list);
  }

  const walk = (node: IAutoMovieScriptNode, slug: string | null): void => {
    let current = slug;
    if (node.kind === "scene") current = screenplaySceneSlug(node.payload);
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
