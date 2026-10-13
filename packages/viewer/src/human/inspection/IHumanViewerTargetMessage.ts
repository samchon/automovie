/**
 * A message a worker target sent back through the browser session.
 *
 * @evidence contracts/common.md#principled-implementation A nested worker protocol reply carries its originating session ID beside the JSON message text.
 * @evidence contracts/common.md#clear-and-simple-design The transport envelope keeps session routing separate from parsing the nested protocol response.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The original JSON message remains text and the envelope supplies no fabricated command reply.
 * @evidence contracts/common.md#meaningful-documentation Documents the session correlation and unparsed protocol-message body.
 * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation A nested worker protocol reply carries its originating session ID beside the JSON message text.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform The transport envelope keeps session routing separate from parsing the nested protocol response.
 * @author Samchon
 */
export interface IHumanViewerTargetMessage {
  /**
   * The session that carried it.
   *
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation The session that carried it. A nested worker protocol reply carries its originating session ID beside the JSON message text.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform The session that carried it. The transport envelope keeps session routing separate from parsing the nested protocol response.
   */
  sessionId: string;

  /**
   * The protocol message as JSON text.
   *
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation The protocol message as JSON text. A nested worker protocol reply carries its originating session ID beside the JSON message text.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform The protocol message as JSON text. The transport envelope keeps session routing separate from parsing the nested protocol response.
   */
  message: string;
}
