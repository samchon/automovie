import type { IHumanViewerRevisionsEntries } from "./IHumanViewerRevisionsEntries";

/**
 * What the revision worker is started with: everything its digests need
 * except file access, which it does itself, and the basis digests, which
 * arrive with each change.
 *
 * @evidence contracts/common.md#meaningful-documentation Names every member.
 * @author Samchon
 */
export interface IHumanViewerRevisionsWorkerInit {
  /** Repository root with forward slashes. */
  root: string;

  /** Entry files of each digest's import graph. */
  entries: IHumanViewerRevisionsEntries;

  /** Files that change every result without being imported. */
  extra: string[];

  /** The published basis digests at start. */
  bases: string;
}
