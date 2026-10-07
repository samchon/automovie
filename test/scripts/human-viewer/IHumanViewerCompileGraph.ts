/**
 * The import graph and compiler inputs the human compile reports, all paths
 * relative to the human package. Every file named here is watched, so an
 * edit to a type-only dependency or a config still invalidates the build.
 *
 * @evidence contracts/common.md#meaningful-documentation Names every reported input group.
 * @author Samchon
 */
export interface IHumanViewerCompileGraph {
  /** Import edges, from a file to the files it imports. */
  edges: Record<string, string[]>;

  /** Global declaration files. */
  globals: string[];

  /** Configuration files the compile read. */
  configs: string[];

  /** Candidate resolution paths probed per import, when reported. */
  candidates?: Record<string, string[]>;

  /** Other files module resolution read, when reported. */
  resolutionInputs?: string[];
}
