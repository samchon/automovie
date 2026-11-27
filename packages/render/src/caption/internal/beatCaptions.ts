import type {
  IAutoMovieBeatCaption,
  IAutoMovieScript,
  IAutoMovieScriptNode,
} from "@automovie/interface";

import { screenplaySceneSlug } from "../../screenplay/internal/screenplaySceneSlug";

/*
 * Index each beat's caption and enclosing scene slug from the screenplay tree,
 * keyed by beat id: `AutoMovieRenderCaption.planSidecar` consults it per span.
 *
 * The walk is depth-first from every root node, children in declaration order,
 * carrying the nearest scene slug down. A script whose `tree` is null or
 * absent, or a tree with no root, yields an empty map, so every span captions
 * null. A node unreachable from a root is never visited, and a beat id that
 * appears on two beat nodes keeps the later visit; commit validation refuses
 * both shapes, so neither reaches a committed script.
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
