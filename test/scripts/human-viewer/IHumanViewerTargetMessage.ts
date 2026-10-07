/**
 * A message a worker target sent back through the browser session.
 *
 * @evidence contracts/common.md#meaningful-documentation Names both members.
 * @author Samchon
 */
export interface IHumanViewerTargetMessage {
  /** The session that carried it. */
  sessionId: string;

  /** The protocol message as JSON text. */
  message: string;
}
