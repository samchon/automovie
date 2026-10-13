/**
 * One edit batch sent to the revision worker.
 *
 * @author Samchon
 */
export interface IHumanViewerRevisionsChange {
  /** Files edited, created or removed, with forward slashes. */
  files: string[];

  /** The published basis digests after the batch. */
  bases: string;
}
