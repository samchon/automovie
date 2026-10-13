/**
 * The part of a Vite module graph node the generation invalidator reads.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the one member read and its null meaning.
 *
 * @evidence contracts/common.md#principled-implementation A nullable Vite module id preserves whether a graph node actually corresponds to a file.
 * @evidence contracts/common.md#clear-and-simple-design Only the id read by invalidation is projected from the module node.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A null id remains non-file state rather than acquiring a guessed source path.
 *
 * @author Samchon
 */
export interface IHumanViewerModuleNode {
  /** Resolved module id with any query, or null for a module without a file. */
  id: string | null;
}
