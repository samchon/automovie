/**
 * A document the viewer refused or has not yet decided, with the reason: an
 * input file, the published person generation, or a document the viewer
 * itself authors (the standard people), which takes the same owner admission.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the refused file and why.
 * @author Samchon
 */
export interface IHumanViewerRejectedInput {
  /**
   * The input file name inside the inputs directory, the generation view
   * paths, or `viewer-authored <document id>` for a document the viewer builds.
   */
  file: string;

  /** Why it was refused, or what it is waiting for when pending. */
  reason: string;

  /**
   * True while the input is not yet decided (a sidecar still being read, a
   * document awaiting admission); false for a refusal that stands until the
   * file changes.
   */
  pending: boolean;
}
