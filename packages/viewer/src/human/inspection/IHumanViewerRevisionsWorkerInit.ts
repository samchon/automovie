import type { IHumanViewerRevisionsEntries } from "./IHumanViewerRevisionsEntries.js";
import type { IHumanViewerNodeInputScope } from "./IHumanViewerNodeInputScope.js";

/**
 * What the revision worker is started with: everything its digests need except file access, which it does itself, and the basis digests, which arrive with each change.
 *
 * @evidence contracts/common.md#principled-implementation Worker initialization supplies the repository root, graph entries, non-imported shared inputs and initial basis digests.
 * @evidence contracts/common.md#clear-and-simple-design File access stays inside the worker while initialization carries only graph configuration and starting authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Extra digest inputs are declared explicitly rather than supplied by hidden runtime or subject-specific dependencies.
 * @evidence contracts/common.md#meaningful-documentation Defines normalized root paths, entry graphs, cross-domain extra files and starting basis values.
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

