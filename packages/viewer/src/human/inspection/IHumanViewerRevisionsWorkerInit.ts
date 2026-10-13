import type { IHumanViewerRevisionsEntries } from "./IHumanViewerRevisionsEntries.js";
import type { IHumanViewerNodeInputScope } from "./IHumanViewerNodeInputScope.js";

/**
 * What the revision worker is started with: everything its digests need except file access, which it does itself, and the basis digests, which arrive with each change.
 *
 * @author Samchon
 */
export interface IHumanViewerRevisionsWorkerInit {
  /** Same checked-loader input scope used by the host's numerical source witnesses. */
  checkedInputs?: IHumanViewerNodeInputScope;

  /** Repository root with forward slashes. */
  root: string;

  /** Entry files of each digest's import graph. */
  entries: IHumanViewerRevisionsEntries;

  /** Files that change every result without being imported. */
  extra: string[];

  /** The published basis digests at start. */
  bases: string;
}

