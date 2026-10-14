import type { ServerResponse } from "node:http";

import type { createHumanViewerGenerationWindows } from "./createHumanViewerGenerationWindows.js";

/**
 * What the generation window routes act on.
 *
 * @evidence contracts/common.md#principled-implementation Generation routes bind a candidate window owner to the real HTTP response so a held connection scopes source-generation observation.
 * @evidence contracts/common.md#clear-and-simple-design URL, response, JSON writer and existing window owner provide the complete hold/label route dependencies.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A window label comes from observed source proof rather than assigning the desired revision to every candidate.
 * @evidence contracts/common.md#meaningful-documentation Comments identify request routing, response writing and the generation-window owner borrowed by the routes.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The route-props record chooses no token lookup or source-window labeling algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each hold is an effectful candidate lifetime; equal desired source revisions alone cannot merge different connection holds.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The response-close listener ends its held window; the generation-window owner retains label authority and the HTTP server owns the transport.
 *
 * @author Samchon
 */
export interface IServeHumanViewerGenerationProps {
  /** The request URL. */
  url: URL;

  /** The response. */
  response: ServerResponse;

  /**
   * Serialize the generation label or refusal and finish its HTTP response.
   *
   * @evidence contracts/common.md#principled-implementation Generation-label responses preserve the window owner's proven label, null unproven label or explicit unknown-token refusal.
   * @evidence contracts/common.md#clear-and-simple-design A server writer supplies HTTP JSON completion while window routes choose the label result.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unproven source labels are not rewritten as the current revision during response serialization.
   * @evidence contracts/common.md#meaningful-documentation The member identifies label/refusal serialization and response completion.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The generation JSON writer chooses no label lookup or encoding implementation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Answering one label request changes that response; identical labels do not share response-write effects.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The transport owns its completion buffers; label writing creates no additional generation hold.
   */
  json: (value: unknown) => void;

  /** The generation windows. */
  windows: ReturnType<typeof createHumanViewerGenerationWindows>;
}
