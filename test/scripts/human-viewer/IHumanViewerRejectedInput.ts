/**
 * An input file the viewer refused, with the reason.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the refused file and why.
 * @author Samchon
 */
export interface IHumanViewerRejectedInput {
  /** File name inside the inputs directory. */
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
