/**
 * A message a worker target sent back through the browser session.
 *
 * @author Samchon
 */
export interface IHumanViewerTargetMessage {
  /** The session that carried it. */
  sessionId: string;

  /** The protocol message as JSON text. */
  message: string;
}
