/**
 * The part of a Vite module graph node the generation invalidator reads.
 *
 * @author Samchon
 */
export interface IHumanViewerModuleNode {
  /** Resolved module id with any query, or null for a module without a file. */
  id: string | null;
}
