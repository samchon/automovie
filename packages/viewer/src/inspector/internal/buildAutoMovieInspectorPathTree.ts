import type { IAutoMovieViewerInspectorPathNode } from "../IAutoMovieViewerInspectorPathNode.js";

/*
 * Arrange identity paths into the tree of their names, for the selection panel.
 *
 * Each distinct path becomes one node marked `drawn`, and each prefix of it a
 * node above, created once however many paths share it. Siblings keep the order
 * in which their first path appeared, so paths listed in scene order give the
 * scene's order, and a path repeated later, as two objects that share a path
 * are, adds nothing. The empty path, which an object with no named ancestor
 * has, becomes one top-level node with the empty name and no pattern.
 *
 * ```ts
 * const tree = AutoMovieViewerInspector.buildPathTree({
 *   paths: listAutoMovieInspectionPaths(scene).map(({ path }) => path),
 * });
 * ```
 */
export function buildAutoMovieInspectorPathTree(
  paths: readonly string[],
): IAutoMovieViewerInspectorPathNode[] {
  const roots: IAutoMovieViewerInspectorPathNode[] = [];
  const nodes: Map<string, IAutoMovieViewerInspectorPathNode> = new Map<
    string,
    IAutoMovieViewerInspectorPathNode
  >();
  for (const path of paths) {
    const names: string[] = path === "" ? [""] : path.split("/");
    let siblings: IAutoMovieViewerInspectorPathNode[] = roots;
    let node: IAutoMovieViewerInspectorPathNode | undefined;
    let prefix: string = "";
    for (let depth: number = 0; depth < names.length; depth++) {
      prefix = depth === 0 ? names[0]! : `${prefix}/${names[depth]!}`;
      node = nodes.get(prefix);
      if (node === undefined) {
        node = {
          name: names[depth]!,
          path: prefix,
          pattern: prefix === "" ? null : depth === 0 ? `${prefix}/**` : prefix,
          drawn: false,
          children: [],
        };
        nodes.set(prefix, node);
        siblings.push(node);
      }
      siblings = node.children;
    }
    node!.drawn = true;
  }
  return roots;
}
