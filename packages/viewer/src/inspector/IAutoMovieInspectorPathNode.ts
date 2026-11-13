/**
 * One name in the tree of a subject's identity paths, as the selection panel lists it.
 *
 * @evidence contracts/development/design.md#principled-representation A path is names joined by `/`, so its prefixes form a tree; each node is one prefix, with the pattern that selects exactly that prefix and its subtree, and whether something drawn sits at that exact path or only beneath it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Produced by `buildAutoMovieInspectorPathTree` and read by the selection panel, which shows the name, edits by the pattern, and recurses into the children.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No node names a subject kind or a part; groups and objects are told apart only by `drawn`. The pattern is null where the path grammar has no pattern for exactly that node.
 * @evidence contracts/development/common.md#meaningful-documentation States what a node stands for and what each member holds.
 */
export interface IAutoMovieInspectorPathNode {
  /** The last name of the path, or the empty string for the empty path of an object with no named ancestor. */
  name: string;

  /** The names from the scene down to this node, joined by `/`. */
  path: string;

  /**
   * The pattern that selects this node and everything beneath it, and nothing else: the path itself when it has two names or more, `<name>/**` for a top-level name, since a pattern of one name matches that name at any depth, and null for the empty path, which only `**` reaches.
   */
  pattern: string | null;

  /** Whether an object or mark sits at exactly this path, rather than only beneath it. */
  drawn: boolean;

  /** The nodes one name deeper, in the order their paths first appeared. */
  children: IAutoMovieInspectorPathNode[];
}
