/**
 * An input file the viewer refused, with the reason.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the refused file and why.
 * @author Samchon
 */
export interface IHumanViewerRejectedInput {
  /** File name inside the inputs directory. */
  file: string;

  /** Why it was refused. */
  reason: string;
}
