/**
 * The part of a Vite module graph node the generation invalidator reads.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the one member read and its null meaning.
 * @author Samchon
 */
export interface IHumanViewerModuleNode {
  /** Resolved module id with any query, or null for a module without a file. */
  id: string | null;
}
