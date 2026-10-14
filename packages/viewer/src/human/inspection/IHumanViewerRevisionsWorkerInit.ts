import type { IHumanViewerNodeInputScope } from "./IHumanViewerNodeInputScope.js";
import type { IHumanViewerRevisionsEntries } from "./IHumanViewerRevisionsEntries.js";

/**
 * What the revision worker is started with: its graph configuration and initial basis digests. File access stays in the worker, and later changes carry refreshed basis digests.
 *
 * @evidence contracts/common.md#principled-implementation Worker initialization supplies graph entries, checked-loader scope and non-imported dependencies so its later digests follow the host's authority.
 * @evidence contracts/common.md#clear-and-simple-design Configuration is transferred once; current source access stays in the worker and updated basis digests travel with edit messages.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Checked inputs preserve complete loader byte/membership witnesses rather than dropping unimported type-error files from browser admission.
 * @evidence contracts/common.md#meaningful-documentation Comments document normalized repository root, graph roots, extra dependencies, initial basis digest and optional checked-loader scope.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The initialization type chooses no worker scheduling or dependency-hash implementation.
 * @evidence contracts/performance.md#reuse-equivalent-work Entry roots and extra files define digest equivalence; checked inputs additionally invalidate browser admission on file membership or byte changes.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Initialization transfers descriptive configuration, while createHumanViewerRevisionsWorker owns the actual thread and queued responses.
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
