import type { IAutoMovieInspectorPathNode } from "./IAutoMovieInspectorPathNode.js";

/**
 * Arrange identity paths into the tree of their names, for the selection panel.
 *
 * Each distinct path becomes one node marked `drawn`, and each prefix of it a node above, created once however many paths share it. Siblings keep the order in which their first path appeared, so paths listed in scene order give the scene's order, and a path repeated later, as two objects that share a path are, adds nothing. The empty path, which an object with no named ancestor has, becomes one top-level node with the empty name and no pattern.
 *
 * ```ts
 * const tree = buildAutoMovieInspectorPathTree(listAutoMovieInspectionPaths(scene).map(({ path }) => path));
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what becomes a node, the order, what a repeated path does, the empty path and each node's pattern rule by reference to the node type.
 * @evidence contracts/development/implementation.md#principled-implementation A path is split on `/` as the path grammar splits it, so a node's prefix is a path the grammar can name; an anchored pattern (one holding `/`) selects that prefix and its subtree, which is why a top-level name is written `<name>/**`.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One walk per path down a map from prefix to node, creating what is missing.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No name is treated specially; a name holding a wildcard character stays a wildcard in its pattern, because the grammar has no escape.
 * @evidence contracts/development/implementation.md#efficient-algorithms One hashed lookup per name of every path; each lookup key is the prefix built by appending one name, so the cost is the total length of the prefixes, which for paths a few names deep is a small multiple of their own length.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of one list.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh tree and keeps nothing.
 */
export function buildAutoMovieInspectorPathTree(
  paths: readonly string[],
): IAutoMovieInspectorPathNode[] {
  const roots: IAutoMovieInspectorPathNode[] = [];
  const nodes: Map<string, IAutoMovieInspectorPathNode> = new Map<
    string,
    IAutoMovieInspectorPathNode
  >();
  for (const path of paths) {
    const names: string[] = path === "" ? [""] : path.split("/");
    let siblings: IAutoMovieInspectorPathNode[] = roots;
    let node: IAutoMovieInspectorPathNode | undefined;
    let prefix: string = "";
    for (let depth: number = 0; depth < names.length; depth++) {
      prefix = depth === 0 ? names[0]! : `${prefix}/${names[depth]!}`;
      node = nodes.get(prefix);
      if (node === undefined) {
        node = {
          name: names[depth]!,
          path: prefix,
          pattern:
            prefix === "" ? null : depth === 0 ? `${prefix}/**` : prefix,
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
