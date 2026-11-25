/**
 * One name in the tree of a subject's identity paths, as the selection panel
 * lists it.
 */
export interface IAutoMovieInspectorPathNode {
  /**
   * The last name of the path, or the empty string for the empty path of an
   * object with no named ancestor.
   */
  name: string;

  /** The names from the scene down to this node, joined by `/`. */
  path: string;

  /**
   * The pattern that selects this node and everything beneath it, and nothing
   * else: the path itself when it has two names or more, `<name>/**` for a
   * top-level name, since a pattern of one name matches that name at any depth,
   * and null for the empty path, which only `**` reaches.
   */
  pattern: string | null;

  /**
   * Whether an object or mark sits at exactly this path, rather than only
   * beneath it.
   */
  drawn: boolean;

  /** The nodes one name deeper, in the order their paths first appeared. */
  children: IAutoMovieInspectorPathNode[];
}
