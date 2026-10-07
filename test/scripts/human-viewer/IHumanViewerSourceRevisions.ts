import type { IHumanViewerMovedDomains } from "./IHumanViewerMovedDomains";

/**
 * The revision owner as source watching uses it.
 *
 * @evidence contracts/common.md#meaningful-documentation Names both operations.
 * @author Samchon
 */
export interface IHumanViewerSourceRevisions {
  /** Whether a file is reached by any domain's import graph. */
  reaches: (file: string) => boolean;

  /** Record changed files and name the revision domains they moved, computed off the request thread. */
  changed: (files: string[]) => Promise<IHumanViewerMovedDomains>;
}
